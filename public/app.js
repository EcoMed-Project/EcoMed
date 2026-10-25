let map, markers;
const status = document.querySelector("#status");
const list = document.querySelector("#place-list");
function setStatus(message, error = false) { if (status) { status.textContent = message; status.style.color = error ? "#b42318" : ""; } }
function initMap() {
  if (!window.L || !document.querySelector("#map") || map) return;
  map = L.map("map", { scrollWheelZoom: false }).setView([-14.235, -51.9253], 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
  markers = L.layerGroup().addTo(map);
}
function esc(value) { const node = document.createElement("span"); node.textContent = value || ""; return node.innerHTML; }
function showOrigin(coords, device) {
  initMap();
  if (!map) return;
  markers.clearLayers();
  map.setView([coords.lat, coords.lng], device ? 15 : 14);
  L.marker([coords.lat, coords.lng]).addTo(markers).bindPopup(device ? "Localização do aparelho" : "Referência aproximada do CEP");
  if (device?.accuracy) L.circle([coords.lat, coords.lng], { radius: device.accuracy, color: "#08794f", weight: 1 }).addTo(markers);
}
function renderPoints(data, device) {
  showOrigin(data.origin, device);
  list.innerHTML = "";
  const bounds = [[data.origin.lat, data.origin.lng]];
  data.points.forEach(point => {
    if (map) {
      const marker = L.marker([point.lat, point.lng]).addTo(markers).bindPopup(`<strong>${esc(point.name)}</strong>`);
      bounds.push([point.lat, point.lng]);
      marker.on("click", () => document.getElementById(point.id)?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    }
    const item = document.createElement("article"); item.className = "place"; item.id = point.id;
    const distance = Number.isFinite(point.distanceKm) ? `<p>${point.distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km em linha reta da referência da busca</p>` : "";
    item.innerHTML = `<span class="tag">${esc(point.kind)} - ${esc(point.source)}</span><h4>${esc(point.name)}</h4><p>${esc(point.address)}</p>${distance}${point.hours ? `<p>Horários informados: ${esc(point.hours)}</p>` : ""}<a target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/directions?to=${point.lat}%2C${point.lng}">Abrir rota em nova guia</a>`;
    list.append(item);
  });
  if (map && bounds.length > 1) map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
  if (!data.points.length) list.innerHTML = '<div class="empty">Nenhum estabelecimento mapeado encontrado em até 6 km.</div>';
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
    navigator.geolocation.getCurrentPosition(position => resolve({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy }), error => reject(new Error(error.code === 1 ? "Localização não autorizada. Você pode buscar somente pelo CEP." : error.code === 3 ? "O aparelho demorou a responder. Tente novamente ou busque pelo CEP." : "Localização indisponível. Ative a localização do aparelho ou busque pelo CEP.")), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
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
    if (!coords) throw new Error([postal.status === "rejected" ? postal.reason.message : address?.notice, device.status === "rejected" ? device.reason.message : ""].filter(Boolean).join(" "));
    const messages = [];
    if (position) messages.push(`Busca pela localização atual do aparelho. Precisão informada: aproximadamente ${Math.round(position.accuracy)} m.`);
    if (address) messages.push(`CEP ${cep.slice(0, 5)}-${cep.slice(5)}: ${address.address}. ${position ? "A posição do aparelho é a referência das distâncias; o CEP não altera essa posição." : address.notice}`);
    if (postal.status === "rejected") messages.push(postal.reason.message);
    if (device.status === "rejected") messages.push(device.reason.message + " A busca continua pela região do CEP.");
    reference.textContent = messages.join(" ");
    showOrigin(coords, position);
    setStatus("Referência localizada. Consultando estabelecimentos em até 6 km…");
    const data = await requestJSON(`/api/collection-points?near=${coords.lat},${coords.lng}`, signal);
    if (id !== activeSearch) return;
    renderPoints(data, position);
    setStatus(data.notice);
  } catch (error) {
    if (id !== activeSearch || error.name === "AbortError") return;
    setStatus(error.message || "Não foi possível concluir a busca. Tente novamente.", true);
    list.innerHTML = '<div class="empty">A busca não foi concluída. Confira a mensagem acima e tente novamente.</div>';
  } finally {
    if (id === activeSearch) { controls.forEach(button => { button.disabled = false; }); list.setAttribute("aria-busy", "false"); }
  }
}
document.querySelector("#cep-form")?.addEventListener("submit", event => { event.preventDefault(); search("cep"); });
document.querySelector("#cep")?.addEventListener("input", event => { const digits = event.target.value.replace(/\D/g, "").slice(0, 8); event.target.value = digits.replace(/(\d{5})(\d)/, "$1-$2"); });
document.querySelector("#location-button")?.addEventListener("click", () => search("device"));
document.querySelector("#combined-button")?.addEventListener("click", () => search("combined"));
document.querySelector("#simulate")?.addEventListener("click", async () => {
  const material = document.querySelector('input[name="material"]:checked').value;
  const decision = document.querySelector("#decision"); decision.textContent = "Verificando condições de segurança…";
  try { const response = await fetch("/api/container/decision", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ material, cameraReady: document.querySelector("#camera").checked, binsAvailable: document.querySelector("#capacity").checked }) }); const data = await response.json(); decision.textContent = data.allowed ? `Decisão segura: ${data.reason}` : `Decisão bloqueada: ${data.reason}`; decision.style.color = data.allowed ? "#8aefb7" : "#ffd184"; } catch { decision.textContent = "Decisão bloqueada: não foi possível verificar. Por segurança, a tampa permanece fechada."; }
});
initMap();
