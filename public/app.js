let map;
let markers;
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
function renderPoints(data) {
  initMap(); list.innerHTML = "";
  if (map) { markers.clearLayers(); const bounds = []; L.marker([data.origin.lat, data.origin.lng]).addTo(markers).bindPopup("Sua busca"); bounds.push([data.origin.lat, data.origin.lng]); data.points.forEach((point) => { const marker = L.marker([point.lat, point.lng]).addTo(markers).bindPopup(`<strong>${esc(point.name)}</strong>`); bounds.push([point.lat, point.lng]); marker.on("click", () => document.querySelector(`#${CSS.escape(point.id)}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })); }); if (bounds.length > 1) map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 }); else map.setView(bounds[0], 13); }
  data.points.forEach((point) => { const item = document.createElement("article"); item.className = "place"; item.id = point.id; const route = `https://www.openstreetmap.org/directions?to=${point.lat}%2C${point.lng}`; item.innerHTML = `<span class="tag">${esc(point.kind)} - ${esc(point.source)}</span><h4>${esc(point.name)}</h4><p>${esc(point.address)}</p>${point.hours ? `<p>Horários informados: ${esc(point.hours)}</p>` : ""}<a target="_blank" rel="noopener noreferrer" href="${route}">Abrir rota em nova guia</a>`; list.append(item); });
  setStatus(data.notice, Boolean(data.fallback));
}
async function findPoints(coords) {
  setStatus("Consultando locais próximos no OpenStreetMap…"); list.innerHTML = '<div class="empty">Buscando locais…</div>';
  try { const response = await fetch(`/api/collection-points?near=${coords.lat},${coords.lng}`); const data = await response.json(); if (!response.ok) throw new Error(data.error); renderPoints(data); } catch (error) { setStatus(error.message || "Não foi possível buscar locais.", true); list.innerHTML = '<div class="empty">Tente novamente em alguns instantes.</div>'; }
}
document.querySelector("#cep-form")?.addEventListener("submit", async (event) => {
  event.preventDefault(); const input = document.querySelector("#cep"); const cep = input.value.replace(/\D/g, "");
  if (cep.length !== 8) return setStatus("Digite os 8 números do CEP.", true);
  setStatus("Localizando o CEP…");
  try { const response = await fetch(`/api/cep/${cep}`); const data = await response.json(); if (!response.ok) throw new Error(data.error); if (!data.coordinates) throw new Error("Encontramos o CEP, mas não foi possível localizar suas coordenadas. Use sua localização."); setStatus(`CEP localizado: ${data.address}. Buscando locais…`); findPoints(data.coordinates); } catch (error) { setStatus(error.message, true); }
});
document.querySelector("#cep")?.addEventListener("input", (event) => { const digits = event.target.value.replace(/\D/g, "").slice(0, 8); event.target.value = digits.replace(/(\d{5})(\d)/, "$1-$2"); });
document.querySelector("#location-button")?.addEventListener("click", () => {
  if (!navigator.geolocation) return setStatus("Este navegador não oferece geolocalização. Use o CEP.", true);
  setStatus("Aguardando sua autorização de localização…");
  navigator.geolocation.getCurrentPosition((position) => findPoints({ lat: position.coords.latitude, lng: position.coords.longitude }), (error) => setStatus(error.code === 1 ? "Localização não autorizada. Use o CEP." : "Não foi possível obter sua localização. Use o CEP.", true), { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
});
document.querySelector("#simulate")?.addEventListener("click", async () => {
  const material = document.querySelector('input[name="material"]:checked').value;
  const decision = document.querySelector("#decision"); decision.textContent = "Verificando condições de segurança…";
  try { const response = await fetch("/api/container/decision", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ material, cameraReady: document.querySelector("#camera").checked, binsAvailable: document.querySelector("#capacity").checked }) }); const data = await response.json(); decision.textContent = data.allowed ? `Decisão segura: ${data.reason}` : `Decisão bloqueada: ${data.reason}`; decision.style.color = data.allowed ? "#8aefb7" : "#ffd184"; } catch { decision.textContent = "Decisão bloqueada: não foi possível verificar. Por segurança, a tampa permanece fechada."; }
});
initMap();
