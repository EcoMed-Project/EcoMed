import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLocationService, coordinates } from "./location-service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const location = createLocationService();

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

app.get("/healthz", (_req, res) => res.status(200).json({ ok: true, service: "EcoMed Brasil", mode: "local" }));
app.get("/api/cep/:cep", async (req, res) => {
  try { res.json(await location.lookupCep(req.params.cep)); }
  catch (error) { res.status(error.status || 503).json({ error: error.message }); }
});
app.get("/api/collection-points", async (req, res) => {
  const point = coordinates(req.query.near);
  if (!point) return res.status(400).json({ error: "Localização inválida." });
  try { res.json(await location.collectionPoints(point)); }
  catch (error) { res.status(error.status || 503).json({ origin: point, points: [], error: error.message }); }
});
app.post("/api/container/decision", (req, res) => {
  const material = String(req.body?.material || "");
  if (req.body?.cameraReady !== true || req.body?.binsAvailable !== true || !["glass", "packaging"].includes(material)) return res.status(409).json({ allowed: false, compartment: null, reason: "Por segurança, a tampa permanece fechada até haver identificação confiável e compartimento disponível." });
  const compartment = material === "glass" ? "vidro" : "caixas e embalagens";
  res.json({ allowed: true, compartment, reason: `Sinalização ativada para ${compartment}.` });
});
app.use((_req, res) => res.status(404).sendFile(path.join(__dirname, "public", "404.html")));
app.listen(port, () => console.log(`EcoMed Brasil em http://localhost:${port}`));
