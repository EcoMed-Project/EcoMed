import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const placeCache = new Map();

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

const demoPoints = [{ id: "demo-vm", name: "Ponto demonstrativo — EcoMed", address: "Use a busca para encontrar pontos reais próximos", lat: -23.5505, lng: -46.6333, kind: "Demonstração", source: "demo" }];
const onlyDigits = (value) => String(value || "").replace(/\D/g, "");
function coordinates(value) {
  const [lat, lng] = String(value || "").split(",").map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

app.get("/healthz", (_req, res) => res.status(200).json({ ok: true, service: "EcoMed Brasil", mode: "local" }));
app.get("/api/cep/:cep", async (req, res) => {
  const cep = onlyDigits(req.params.cep);
  if (cep.length !== 8) return res.status(400).json({ error: "Informe um CEP com 8 dígitos." });
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(7000) });
    if (!response.ok) throw new Error("ViaCEP indisponível");
    const data = await response.json();
    if (data.erro) return res.status(404).json({ error: "CEP não encontrado." });
    const address = [data.logradouro, data.bairro, data.localidade, data.uf].filter(Boolean).join(", ");
    const geo = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(`${address}, Brasil`)}`, { headers: { "User-Agent": "EcoMedBrasil/1.0 (educational project)" }, signal: AbortSignal.timeout(7000) });
    const result = geo.ok ? await geo.json() : [];
    res.json({ cep, address, city: data.localidade, state: data.uf, coordinates: result[0] ? { lat: Number(result[0].lat), lng: Number(result[0].lon) } : null });
  } catch { res.status(503).json({ error: "Não foi possível consultar o CEP agora. Tente novamente ou use sua localização." }); }
});
app.get("/api/collection-points", async (req, res) => {
  const point = coordinates(req.query.near);
  if (!point) return res.status(400).json({ error: "Localização inválida." });
  const key = `${point.lat.toFixed(2)},${point.lng.toFixed(2)}`;
  const cached = placeCache.get(key);
  if (cached && cached.expires > Date.now()) return res.json({ ...cached.value, cached: true });
  const query = `[out:json][timeout:12];(nwr[amenity=pharmacy](around:6000,${point.lat},${point.lng});nwr[healthcare=pharmacy](around:6000,${point.lat},${point.lng}););out center tags 30;`;
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", "User-Agent": "EcoMedBrasil/1.0 (educational project)" }, body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Overpass indisponível");
    const data = await response.json();
    const points = data.elements.map((item) => ({ id: `osm-${item.type}-${item.id}`, name: item.tags?.name || "Farmácia mapeada no OpenStreetMap", address: [item.tags?.["addr:street"], item.tags?.["addr:housenumber"], item.tags?.["addr:suburb"]].filter(Boolean).join(", ") || "Endereço não informado no OpenStreetMap", lat: item.lat ?? item.center?.lat, lng: item.lon ?? item.center?.lon, phone: item.tags?.phone || null, hours: item.tags?.opening_hours || null, kind: "Confirme se recebe medicamentos", source: "OpenStreetMap" })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
    const value = { origin: point, points: points.length ? points : demoPoints, notice: points.length ? "Locais mapeados no OpenStreetMap. Confirme diretamente se o local recebe medicamentos." : "Nenhum local foi retornado. Exibindo uma referência demonstrativa." };
    placeCache.set(key, { value, expires: Date.now() + 600000 }); res.json(value);
  } catch { res.json({ origin: point, points: demoPoints, fallback: true, notice: "A consulta ao OpenStreetMap está indisponível. Exibindo somente uma referência demonstrativa; não use como confirmação de coleta." }); }
});
app.post("/api/container/decision", (req, res) => {
  const material = String(req.body?.material || "");
  if (req.body?.cameraReady !== true || req.body?.binsAvailable !== true || !["glass", "packaging"].includes(material)) return res.status(409).json({ allowed: false, compartment: null, reason: "Por segurança, a tampa permanece fechada até haver identificação confiável e compartimento disponível." });
  const compartment = material === "glass" ? "vidro" : "caixas e embalagens";
  res.json({ allowed: true, compartment, reason: `Sinalização ativada para ${compartment}.` });
});
app.use((_req, res) => res.status(404).sendFile(path.join(__dirname, "public", "404.html")));
app.listen(port, () => console.log(`EcoMed Brasil em http://localhost:${port}`));
