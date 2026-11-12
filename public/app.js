let map, markers;
const status = document.querySelector("#status");
const list = document.querySelector("#place-list");

function setStatus(message, error = false) {
  if (status) {
    status.textContent = message;
    status.style.color = error ? "#b42318" : "";
  }
}

function initMap() {
  if (!window.L || !document.querySelector("#map") || map) return;
  map = L.map("map", { scrollWheelZoom: false }).setView([-14.235, -51.9253], 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap"
  }).addTo(map);
  markers = L.layerGroup().addTo(map);
}

function esc(value) {
  const node = document.createElement("span");
  node.textContent = value || "";
  return node.innerHTML;
}

// Haversine distance in km
function distanceKm(lat1, lon1, lat2, lon2) {
  const rad = n => (n * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

// Built-in partner reference posts (EcoMed Network)
const PARTNER_POSTS = [
  { id: 'partner-001', name: 'UBS Central Dr. Paulo Freire', address: 'Rua das Acácias, 123 - Centro, Paulista-SP', lat: -23.5505, lng: -46.6333, kind: 'Farmácia Solidária SUS', hours: 'Seg–Sex 7h–17h' },
  { id: 'partner-002', name: 'Farmácia Solidária Vila Mariana', address: 'Av. Domingos de Morais, 450 - Vila Mariana, SP', lat: -23.5890, lng: -46.6336, kind: 'Farmácia Solidária SUS', hours: 'Seg–Sex 7h–19h | Sáb 8h–13h' },
  { id: 'partner-003', name: 'UBS Pinheiros', address: 'Rua Teodoro Sampaio, 310 - Pinheiros, SP', lat: -23.5612, lng: -46.6933, kind: 'Farmácia Solidária SUS', hours: 'Seg–Sex 7h–17h' },
  { id: 'partner-004', name: 'Centro de Saúde da Lapa', address: 'Rua Guaicurus, 1210 - Lapa, SP', lat: -23.5235, lng: -46.7102, kind: 'Farmácia Solidária SUS', hours: 'Seg–Sex 7h–19h' },
  { id: 'partner-005', name: 'Posto Integrado Mooca', address: 'Rua da Mooca, 2555 - Mooca, SP', lat: -23.5520, lng: -46.5952, kind: 'Farmácia Solidária SUS', hours: 'Seg–Sex 7h–17h | Sáb 7h–12h' }
];

function getPartnerPosts() {
  if (window.medsDb && typeof window.medsDb.getHealthPosts === "function") {
    try {
      const posts = window.medsDb.getHealthPosts();
      if (Array.isArray(posts) && posts.length) return posts;
    } catch {}
  }
  return PARTNER_POSTS;
}

// 1. Primary CEP Pin Icon (Vibrant Red/Coral Teardrop with Radar Pulse)
function createCepIcon() {
  if (!window.L || !L.divIcon) return null;
  return L.divIcon({
    className: "custom-cep-pin",
    html: `
      <div class="cep-pin-wrap" aria-label="Seu CEP / Ponto principal">
        <div class="cep-pin-body">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div class="cep-pin-pulse"></div>
      </div>
    `,
    iconSize: [44, 52],
    iconAnchor: [22, 50],
    popupAnchor: [0, -48]
  });
}

// 2. Secondary Pharmacy Pin Icon (Green Teardrop with White Cross)
function createPharmacyIcon() {
  if (!window.L || !L.divIcon) return null;
  return L.divIcon({
    className: "custom-pharmacy-pin",
    html: `
      <div class="pharmacy-pin-wrap" title="Farmácia ou Ponto de Coleta">
        <div class="pharmacy-pin-body">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z"/>
          </svg>
        </div>
        <div class="pharmacy-pin-shadow"></div>
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 40],
    popupAnchor: [0, -38]
  });
}

// 3. Partner Health Post Icon (Eco-Teal Teardrop with Star)
function createPartnerIcon() {
  if (!window.L || !L.divIcon) return null;
  return L.divIcon({
    className: "custom-partner-pin",
    html: `
      <div class="partner-pin-wrap" title="Farmácia Solidária / Posto SUS Parceiro">
        <div class="partner-pin-body">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#C7D93D">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </div>
        <div class="pharmacy-pin-shadow"></div>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -40]
  });
}

function showOrigin(coords, device, meta = {}) {
  initMap();
  if (!map) return;
  markers.clearLayers();
  map.setView([coords.lat, coords.lng], device ? 15 : 15);

  const isCepSearch = !device;
  const cepLabel = meta.cep ? `CEP ${meta.cep.slice(0, 5)}-${meta.cep.slice(5)}` : (meta.cepFormatted || "Ponto de Referência");
  const title = isCepSearch ? cepLabel : "Localização do Dispositivo";
  const desc = meta.address || (isCepSearch ? "Ponto exato do CEP pesquisado" : "Sua posição atual");

  const cepIcon = createCepIcon();
  const markerOpts = cepIcon ? { icon: cepIcon, zIndexOffset: 3000 } : { zIndexOffset: 3000 };
  const originMarker = L.marker([coords.lat, coords.lng], markerOpts).addTo(markers);

  const popupContent = `
    <div style="font-family:inherit;min-width:210px;padding:4px 0">
      <div style="display:inline-block;background:#e11d48;color:#fff;font-size:0.72rem;font-weight:750;padding:3px 10px;border-radius:100px;margin-bottom:6px;letter-spacing:.03em">
        SEU PONTO DE BUSCA
      </div>
      <div style="font-size:1.05rem;font-weight:750;color:#064b38;margin-bottom:4px">
        ${esc(title)}
      </div>
      <div style="font-size:0.86rem;color:#566b61;line-height:1.45">
        ${esc(desc)}
      </div>
    </div>
  `;

  originMarker.bindPopup(popupContent);
  originMarker.openPopup();

  // Radar circle
  L.circle([coords.lat, coords.lng], {
    radius: device?.accuracy || 300,
    color: "#e11d48",
    fillColor: "#e11d48",
    fillOpacity: 0.1,
    weight: 2
  }).addTo(markers);

  // Immediately plot nearby EcoMed partner health posts so pharmacies are instantly marked
  const partnerPosts = getPartnerPosts();
  const partnerIcon = createPartnerIcon();
  partnerPosts.forEach(post => {
    const dist = distanceKm(coords.lat, coords.lng, post.lat, post.lng);
    if (dist <= 35) {
      const pOpts = partnerIcon ? { icon: partnerIcon, zIndexOffset: 1200 } : { zIndexOffset: 1200 };
      L.marker([post.lat, post.lng], pOpts).addTo(markers).bindPopup(`
        <div style="font-family:inherit;min-width:200px">
          <span style="display:inline-block;background:var(--eco-teal);color:#fff;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:100px;margin-bottom:4px">REDE ECOMED</span>
          <strong style="display:block;color:var(--deep);font-size:0.98rem;margin-top:2px">${esc(post.name)}</strong>
          <p style="margin:4px 0 0;font-size:0.82rem;color:var(--muted)">${esc(post.address)}</p>
          <p style="margin:4px 0 0;font-size:0.8rem;color:var(--eco-teal);font-weight:600">Aproximadamente ${dist.toFixed(1)} km do seu CEP</p>
        </div>
      `);
    }
  });
}

function renderPoints(data, device, meta = {}) {
  showOrigin(data.origin, device, meta);
  list.innerHTML = "";
  const bounds = [[data.origin.lat, data.origin.lng]];

  const pharmacyIcon = createPharmacyIcon();
  const partnerIcon = createPartnerIcon();

  // 1. Add any partner posts within 6km to the list and map if not already present
  const partnerPosts = getPartnerPosts();
  const allPoints = [];

  partnerPosts.forEach(p => {
    const d = distanceKm(data.origin.lat, data.origin.lng, p.lat, p.lng);
    if (d <= 6.5) {
      allPoints.push({
        id: p.id,
        name: p.name,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        distanceKm: d,
        hours: p.hours,
        kind: "Posto Parceiro EcoMed / Farmácia Solidária",
        source: "Rede EcoMed",
        isPartner: true
      });
    }
  });

  // 2. Add OSM points
  if (Array.isArray(data.points)) {
    data.points.forEach(pt => {
      // Avoid duplicate coordinates
      const exists = allPoints.some(existing => distanceKm(existing.lat, existing.lng, pt.lat, pt.lng) < 0.05);
      if (!exists) {
        allPoints.push({ ...pt, isPartner: false });
      }
    });
  }

  // Sort by distance
  allPoints.sort((a, b) => a.distanceKm - b.distanceKm);

  // Render on map and in list
  allPoints.forEach(point => {
    if (map) {
      const iconToUse = point.isPartner ? partnerIcon : pharmacyIcon;
      const markerOpts = iconToUse ? { icon: iconToUse, zIndexOffset: point.isPartner ? 1500 : 800 } : { zIndexOffset: 800 };
      const marker = L.marker([point.lat, point.lng], markerOpts).addTo(markers).bindPopup(`
        <div style="font-family:inherit;min-width:190px">
          <span style="display:inline-block;background:${point.isPartner ? 'var(--eco-teal)' : '#10b981'};color:#fff;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:100px;margin-bottom:4px">
            ${point.isPartner ? 'FARMÁCIA SOLIDÁRIA SUS' : 'FARMÁCIA / PONTO DE COLETA'}
          </span>
          <strong style="display:block;color:var(--deep);font-size:0.96rem;margin-top:2px">${esc(point.name)}</strong>
          <p style="margin:4px 0 0;font-size:0.83rem;color:var(--muted);line-height:1.4">${esc(point.address)}</p>
          <div style="margin-top:6px;font-size:0.8rem;color:var(--deep);font-weight:600">
            ${Number.isFinite(point.distanceKm) ? point.distanceKm.toFixed(1) + ' km em linha reta' : ''}
          </div>
          <div style="margin-top:8px">
            <a target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/directions?to=${point.lat}%2C${point.lng}" style="color:var(--green);font-size:0.82rem;font-weight:700;text-decoration:underline">Ver rota no mapa →</a>
          </div>
        </div>
      `);
      bounds.push([point.lat, point.lng]);
      marker.on("click", () => document.getElementById(point.id)?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }

    const item = document.createElement("article");
    item.className = "place";
    item.id = point.id;
    const distance = Number.isFinite(point.distanceKm)
      ? `<p>${point.distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km em linha reta da referência da busca</p>`
      : "";
    item.innerHTML = `<span class="tag" style="${point.isPartner ? 'background:var(--eco-teal-light);color:var(--eco-teal-dark);font-weight:700' : ''}">${esc(point.kind)} - ${esc(point.source)}</span><h4>${esc(point.name)}</h4><p>${esc(point.address)}</p>${distance}${point.hours ? `<p>Horários informados: ${esc(point.hours)}</p>` : ""}<a target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/directions?to=${point.lat}%2C${point.lng}">Abrir rota em nova guia</a>`;
    list.append(item);
  });

  if (map && bounds.length > 1) {
    map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
  } else if (map) {
    map.setView([data.origin.lat, data.origin.lng], 15);
  }

  if (!allPoints.length) {
    list.innerHTML = '<div class="empty">Nenhum estabelecimento mapeado encontrado em até 6 km.</div>';
  }
}

let activeSearch = 0, searchController;

async function requestJSON(url, signal) {
  const response = await fetch(url, { signal });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir a busca.");
  return data;
}

function locateDevice() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Este navegador não oferece localização. Busque pelo CEP."));
    navigator.geolocation.getCurrentPosition(
      position => resolve({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      }),
      error => reject(new Error(
        error.code === 1 ? "Localização não autorizada. Você pode buscar somente pelo CEP." :
        error.code === 3 ? "O aparelho demorou a responder. Tente novamente ou busque pelo CEP." :
        "Localização indisponível. Ative a localização do aparelho ou busque pelo CEP."
      )),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

async function search(mode) {
  const cep = document.querySelector("#cep").value.replace(/\D/g, "");
  const id = ++activeSearch;
  searchController?.abort();
  searchController = new AbortController();
  const signal = searchController.signal;
  const controls = [...document.querySelectorAll('#cep-form button, #location-button, #combined-button')];
  controls.forEach(button => { button.disabled = true; });
  list.setAttribute("aria-busy", "true");
  list.innerHTML = '<div class="empty">Buscando a referência e os locais próximos…</div>';
  if (markers) markers.clearLayers();
  const reference = document.querySelector("#search-reference");
  reference.textContent = "";

  try {
    if (mode !== "device" && cep.length !== 8) throw new Error("Digite os 8 números do CEP para esta opção.");
    setStatus(mode === "cep" ? "Consultando o CEP e sua região…" : "Aguardando autorização e localização do aparelho…");

    const [postal, device] = await Promise.allSettled([
      mode === "device" ? Promise.resolve(null) : requestJSON(`/api/cep/${cep}`, signal),
      mode === "cep" ? Promise.resolve(null) : locateDevice()
    ]);

    if (id !== activeSearch) return;

    const address = postal.status === "fulfilled" ? postal.value : null;
    const position = device.status === "fulfilled" ? device.value : null;
    const coords = position || address?.coordinates;

    if (!coords) {
      throw new Error([
        postal.status === "rejected" ? postal.reason.message : address?.notice,
        device.status === "rejected" ? device.reason.message : ""
      ].filter(Boolean).join(" "));
    }

    const messages = [];
    if (position) messages.push(`Busca pela localização atual do aparelho. Precisão informada: aproximadamente ${Math.round(position.accuracy)} m.`);
    if (address) messages.push(`CEP ${cep.slice(0, 5)}-${cep.slice(5)}: ${address.address}. ${position ? "A posição do aparelho é a referência das distâncias; o CEP não altera essa posição." : address.notice}`);
    if (postal.status === "rejected") messages.push(postal.reason.message);
    if (device.status === "rejected") messages.push(device.reason.message + " A busca continua pela região do CEP.");
    reference.textContent = messages.join(" ");

    const meta = {
      cep: cep || null,
      address: address?.address || null
    };

    // Plot CEP marker + any immediate partner points right away
    showOrigin(coords, position, meta);
    setStatus("Ponto do CEP localizado! Consultando farmácias e postos em até 6 km…");

    try {
      const data = await requestJSON(`/api/collection-points?near=${coords.lat},${coords.lng}`, signal);
      if (id !== activeSearch) return;
      renderPoints(data, position, meta);
      setStatus(data.notice);
    } catch (apiError) {
      if (id !== activeSearch || apiError.name === "AbortError") return;
      // Graceful fallback: render any partner posts in range so pharmacies still show on the map!
      renderPoints({ origin: coords, points: [] }, position, meta);
      setStatus("Ponto do CEP identificado. Consulta externa demorou a responder, exibindo postos da rede EcoMed próximos.");
    }
  } catch (error) {
    if (id !== activeSearch || error.name === "AbortError") return;
    setStatus(error.message || "Não foi possível concluir a busca. Tente novamente.", true);
    list.innerHTML = '<div class="empty">A busca não foi concluída. Confira a mensagem acima e tente novamente.</div>';
  } finally {
    if (id === activeSearch) {
      controls.forEach(button => { button.disabled = false; });
      list.setAttribute("aria-busy", "false");
    }
  }
}

document.querySelector("#cep-form")?.addEventListener("submit", event => {
  event.preventDefault();
  search("cep");
});

document.querySelector("#cep")?.addEventListener("input", event => {
  const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
  event.target.value = digits.replace(/(\d{5})(\d)/, "$1-$2");
});

document.querySelector("#location-button")?.addEventListener("click", () => search("device"));
document.querySelector("#combined-button")?.addEventListener("click", () => search("combined"));

document.querySelector("#simulate")?.addEventListener("click", async () => {
  const material = document.querySelector('input[name="material"]:checked').value;
  const decision = document.querySelector("#decision");
  decision.textContent = "Verificando condições de segurança…";
  try {
    const response = await fetch("/api/container/decision", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        material,
        cameraReady: document.querySelector("#camera").checked,
        binsAvailable: document.querySelector("#capacity").checked
      })
    });
    const data = await response.json();
    decision.textContent = data.allowed ? `Decisão segura: ${data.reason}` : `Decisão bloqueada: ${data.reason}`;
    decision.style.color = data.allowed ? "#8aefb7" : "#ffd184";
  } catch {
    decision.textContent = "Decisão bloqueada: não foi possível verificar. Por segurança, a tampa permanece fechada.";
  }
});

initMap();
