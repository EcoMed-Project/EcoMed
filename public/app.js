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

function createCepIcon() {
  if (!window.L || !L.divIcon) return null;
  return L.divIcon({
    className: "custom-cep-pin",
    html: `
      <div class="cep-marker-pin" aria-label="Ponto principal da busca">
        <div class="cep-marker-pulse"></div>
        <div class="cep-marker-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 46],
    iconAnchor: [20, 46],
    popupAnchor: [0, -44]
  });
}

function createPharmacyIcon() {
  if (!window.L || !L.divIcon) return null;
  return L.divIcon({
    className: "custom-pharmacy-pin",
    html: `
      <div class="pharmacy-marker-pin" title="Ponto de coleta de medicamentos">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#08794f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16]
  });
}

function showOrigin(coords, device, meta = {}) {
  initMap();
  if (!map) return;
  markers.clearLayers();
  map.setView([coords.lat, coords.lng], device ? 15 : 15);

  const isCepSearch = !device;
  const cepLabel = meta.cep ? `CEP ${meta.cep.slice(0, 5)}-${meta.cep.slice(5)}` : (meta.cepFormatted || "Ponto de Referência");
  const title = isCepSearch ? `📍 ${cepLabel}` : "📍 Localização do Aparelho";
  const desc = meta.address || (isCepSearch ? "Ponto exato do CEP pesquisado" : "Sua posição atual");

  const cepIcon = createCepIcon();
  const markerOpts = cepIcon ? { icon: cepIcon, zIndexOffset: 2500 } : { zIndexOffset: 2500 };
  const originMarker = L.marker([coords.lat, coords.lng], markerOpts).addTo(markers);

  const popupContent = `
    <div style="font-family:inherit;min-width:210px;padding:2px 0">
      <div style="display:inline-block;background:#0d9488;color:#fff;font-size:0.72rem;font-weight:750;padding:3px 10px;border-radius:100px;margin-bottom:6px;letter-spacing:.03em">
        MARCAÇÃO PRINCIPAL
      </div>
      <div style="font-size:1.02rem;font-weight:750;color:#064b38;margin-bottom:4px">
        ${esc(title)}
      </div>
      <div style="font-size:0.85rem;color:#566b61;line-height:1.45">
        ${esc(desc)}
      </div>
    </div>
  `;

  originMarker.bindPopup(popupContent);
  originMarker.openPopup();

  // Radar circle around origin
  L.circle([coords.lat, coords.lng], {
    radius: device?.accuracy || 250,
    color: "#0d9488",
    fillColor: "#0d9488",
    fillOpacity: 0.12,
    weight: 2
  }).addTo(markers);
}

function renderPoints(data, device, meta = {}) {
  showOrigin(data.origin, device, meta);
  list.innerHTML = "";
  const bounds = [[data.origin.lat, data.origin.lng]];
  const pharmacyIcon = createPharmacyIcon();

  data.points.forEach(point => {
    if (map) {
      const markerOpts = pharmacyIcon ? { icon: pharmacyIcon, zIndexOffset: 500 } : {};
      const marker = L.marker([point.lat, point.lng], markerOpts).addTo(markers).bindPopup(`
        <div style="font-family:inherit;min-width:180px">
          <div style="font-size:0.72rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">Ponto de Coleta</div>
          <strong style="color:var(--deep);font-size:0.96rem">${esc(point.name)}</strong>
          <p style="margin:4px 0 0;font-size:0.83rem;color:var(--muted);line-height:1.4">${esc(point.address)}</p>
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
    item.innerHTML = `<span class="tag">${esc(point.kind)} - ${esc(point.source)}</span><h4>${esc(point.name)}</h4><p>${esc(point.address)}</p>${distance}${point.hours ? `<p>Horários informados: ${esc(point.hours)}</p>` : ""}<a target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/directions?to=${point.lat}%2C${point.lng}">Abrir rota em nova guia</a>`;
    list.append(item);
  });

  if (map && bounds.length > 1) {
    map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
  }
  if (!data.points.length) {
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

    showOrigin(coords, position, meta);
    setStatus("Referência localizada. Consultando estabelecimentos em até 6 km…");

    const data = await requestJSON(`/api/collection-points?near=${coords.lat},${coords.lng}`, signal);
    if (id !== activeSearch) return;

    renderPoints(data, position, meta);
    setStatus(data.notice);
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
