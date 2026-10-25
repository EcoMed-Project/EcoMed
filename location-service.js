const headers = { "User-Agent": "EcoMedBrasil/1.0", "Accept-Language": "pt-BR" };
export function coordinates(value) {
  const parts = String(value ?? "").split(",");
  if (parts.length !== 2 || parts.some(part => !part.trim())) return null;
  const [lat, lng] = parts.map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}
export function distanceKm(a, b) {
  const rad = n => n * Math.PI / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export class LocationError extends Error {
  constructor(message, status = 503) { super(message); this.status = status; }
}
export function createLocationService(request = fetch) {
  const cepCache = new Map();
  let geocoderQueue = Promise.resolve();
  let lastGeocode = 0;
  async function json(url, options = {}) {
    const response = await request(url, { headers, signal: AbortSignal.timeout(8000), ...options });
    if (!response.ok) throw new LocationError("Serviço de localização indisponível.", response.status === 404 ? 404 : 503);
    return response.json();
  }
  // Serialize public Nominatim requests and leave one second between starts.
  function geocode(parameters) {
    const task = geocoderQueue.then(async () => {
      const delay = 1100 - (Date.now() - lastGeocode);
      if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
      lastGeocode = Date.now();
      return json("https://nominatim.openstreetmap.org/search?" + new URLSearchParams({ format: "jsonv2", countrycodes: "br", limit: "1", ...parameters }));
    });
    geocoderQueue = task.catch(() => {});
    return task;
  }
  async function lookupCep(input) {
    const cep = String(input).trim().replace(/^(\d{5})-(\d{3})$/, "$1$2");
    if (!/^\d{8}$/.test(cep)) throw new LocationError("Informe um CEP com 8 dígitos.", 400);
    if (cepCache.get(cep)?.expires > Date.now()) return cepCache.get(cep).value;
    const [brazil, via] = await Promise.allSettled([
      json(`https://brasilapi.com.br/api/cep/v2/${cep}`),
      json(`https://viacep.com.br/ws/${cep}/json/`)
    ]);
    const b = brazil.status === "fulfilled" && brazil.value.city ? brazil.value : null;
    const v = via.status === "fulfilled" && !via.value.erro && via.value.localidade ? via.value : null;
    if (!b && !v) {
      if ((via.status === "fulfilled" && via.value.erro) || (brazil.status === "rejected" && brazil.reason.status === 404)) throw new LocationError("CEP não encontrado. Confira os oito números.", 404);
      throw new LocationError("A consulta de CEP está indisponível. Tente novamente ou use a localização do aparelho.");
    }
    const street = v?.logradouro || b?.street || "";
    const neighborhood = v?.bairro || b?.neighborhood || "";
    const city = v?.localidade || b.city;
    const state = v?.uf || b.state;
    const value = { cep, address: [street, neighborhood, city, state].filter(Boolean).join(", "), city, state, coordinates: null, precision: null, source: null };
    const supplied = b?.location?.coordinates;
    // Empty strings and null are missing coordinates, never the point 0,0.
    const suppliedPoint = coordinates(`${supplied?.latitude ?? ""},${supplied?.longitude ?? ""}`);
    if (suppliedPoint && suppliedPoint.lat >= -34 && suppliedPoint.lat <= 6 && suppliedPoint.lng >= -74 && suppliedPoint.lng <= -28) {
      value.coordinates = suppliedPoint; value.precision = "postal_code"; value.source = "BrasilAPI";
    }
    const queries = [
      { parameters: { postalcode: cep.replace(/(\d{5})(\d{3})/, "$1-$2"), city, country: "Brasil" }, precision: "postal_code" },
      ...(street ? [{ parameters: { street, city, state, country: "Brasil" }, precision: "street" }] : []),
      ...(neighborhood ? [{ parameters: { q: `${neighborhood}, ${city}, ${state}, Brasil` }, precision: "neighborhood" }] : [])
    ];
    for (const query of queries) {
      if (value.coordinates) break;
      try {
        const results = await geocode(query.parameters);
        const point = coordinates(`${results[0]?.lat ?? ""},${results[0]?.lon ?? ""}`);
        if (point) { value.coordinates = point; value.precision = query.precision; value.source = "Nominatim"; }
      } catch { /* A geocoder failure must not erase a valid postal address. */ }
    }
    value.notice = value.coordinates
      ? `Referência aproximada ${value.precision === "neighborhood" ? "do bairro" : value.precision === "street" ? "da rua" : "da região do CEP"}. O CEP não identifica a posição exata do aparelho.`
      : "Endereço encontrado, mas os serviços não retornaram coordenadas para esta região. Tente novamente ou combine com a localização do aparelho.";
    if (value.coordinates) cepCache.set(cep, { value, expires: Date.now() + 86400000 });
    return value;
  }
  async function collectionPoints(origin) {
    const query = `[out:json][timeout:12];(nwr[amenity=pharmacy](around:6000,${origin.lat},${origin.lng});nwr[healthcare=pharmacy](around:6000,${origin.lat},${origin.lng}););out center tags;`;
    let data;
    for (const host of ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]) {
      try { data = await json(host, { method: "POST", body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(16000) }); if (Array.isArray(data.elements)) break; } catch {}
    }
    if (!Array.isArray(data?.elements)) throw new LocationError("A consulta de estabelecimentos está indisponível. Sua localização foi identificada; tente buscar novamente.");
    const unique = new Map();
    for (const item of data.elements) {
      const point = coordinates(`${item.lat ?? item.center?.lat ?? ""},${item.lon ?? item.center?.lon ?? ""}`);
      if (!point || distanceKm(origin, point) > 6.05) continue;
      const id = `osm-${item.type}-${item.id}`;
      unique.set(id, { id, ...point, distanceKm: distanceKm(origin, point), name: item.tags?.name || "Farmácia mapeada no OpenStreetMap", address: [item.tags?.["addr:street"], item.tags?.["addr:housenumber"], item.tags?.["addr:suburb"]].filter(Boolean).join(", ") || "Endereço não informado no OpenStreetMap", phone: item.tags?.phone || null, hours: item.tags?.opening_hours || null, kind: "Confirme se recebe medicamentos", source: "OpenStreetMap" });
    }
    return { origin, radiusKm: 6, points: [...unique.values()].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 50), notice: unique.size ? "Estabelecimentos mapeados em até 6 km, ordenados por distância em linha reta. Confirme diretamente se recebem medicamentos." : "Nenhum estabelecimento mapeado foi encontrado em até 6 km. Isso não significa que não existam locais de coleta na região." };
  }
  return { lookupCep, collectionPoints };
}
