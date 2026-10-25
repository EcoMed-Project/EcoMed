import { test } from "node:test";
import assert from "node:assert/strict";
import { createLocationService, coordinates } from "../location-service.js";

const address = { cep: "13183627", city: "Hortolândia", state: "SP", street: "Rua Ana Boaventura Messa", neighborhood: "Jardim Nova Hortolândia II", location: { coordinates: { latitude: "-22.85833", longitude: "-47.22" } } };
const ok = value => ({ ok: true, json: async () => value });
test("CEP from screenshot resolves without device permission or Nominatim", async () => {
  const calls = [];
  const service = createLocationService(async url => { calls.push(url); return url.includes("brasilapi") ? ok(address) : ok({ erro: true }); });
  const result = await service.lookupCep("13183-627");
  assert.deepEqual(result.coordinates, { lat: -22.85833, lng: -47.22 });
  assert.equal(result.city, "Hortolândia");
  assert.equal(result.precision, "postal_code");
  assert.equal(calls.length, 2);
  await service.lookupCep("13183627");
  assert.equal(calls.length, 2, "successful postal result is cached");
});
test("ViaCEP and structured geocoder recover when BrasilAPI is unavailable", async () => {
  let query;
  const service = createLocationService(async url => {
    if (url.includes("brasilapi")) throw new Error("offline");
    if (url.includes("viacep")) return ok({ logradouro: "Rua Ana Boaventura Messa", bairro: "Jardim Nova Hortolândia II", localidade: "Hortolândia", uf: "SP" });
    query = new URL(url); return ok([{ lat: "-22.85", lon: "-47.22" }]);
  });
  const result = await service.lookupCep("13183627");
  assert.equal(query.searchParams.get("postalcode"), "13183-627");
  assert.equal(query.searchParams.get("countrycodes"), "br");
  assert.equal(result.coordinates.lat, -22.85);
});
test("missing coordinates never become 0,0 and geocoder outages preserve address", async () => {
  const service = createLocationService(async url => {
    if (url.includes("brasilapi")) return ok({ ...address, street: "", neighborhood: "", location: { coordinates: { latitude: "", longitude: null } } });
    if (url.includes("viacep")) throw new Error("offline");
    throw new Error("geocoder offline");
  });
  const result = await service.lookupCep("13183627");
  assert.equal(result.city, "Hortolândia");
  assert.equal(result.coordinates, null);
  assert.match(result.notice, /Endereço encontrado/);
});
test("invalid and unknown CEP return distinct errors", async () => {
  const service = createLocationService(async () => ok({ erro: true }));
  await assert.rejects(service.lookupCep("1318362x"), error => error.status === 400);
  await assert.rejects(service.lookupCep("00000000"), error => error.status === 404);
});
test("coordinate validation rejects empty, partial and out-of-range values", () => {
  for (const value of ["", ",", "-22,", "91,10", "-22,-47,5", "NaN,10"]) assert.equal(coordinates(value), null);
  assert.deepEqual(coordinates("0,0"), { lat: 0, lng: 0 });
});
test("nearby search uses a second host, filters distant points and sorts distances", async () => {
  let calls = 0;
  const service = createLocationService(async () => {
    if (++calls === 1) throw new Error("primary down");
    return ok({ elements: [
      { type: "node", id: 2, lat: -22.87, lon: -47.22, tags: { name: "Mais distante" } },
      { type: "node", id: 1, lat: -22.8584, lon: -47.22, tags: { name: "Perto" } },
      { type: "node", id: 3, lat: -23.55, lon: -46.63 }
    ] });
  });
  const result = await service.collectionPoints({ lat: -22.85833, lng: -47.22 });
  assert.equal(calls, 2);
  assert.deepEqual(result.points.map(point => point.id), ["osm-node-1", "osm-node-2"]);
});
test("no results and unavailable providers never fabricate a collection point", async () => {
  const empty = await createLocationService(async () => ok({ elements: [] })).collectionPoints({ lat: -22, lng: -47 });
  assert.deepEqual(empty.points, []);
  await assert.rejects(createLocationService(async () => { throw new Error("offline"); }).collectionPoints({ lat: -22, lng: -47 }), error => error.status === 503);
});
test("Nominatim can recover nearby results when both Overpass hosts fail", async () => {
  const service = createLocationService(async url => {
    if (!url.includes("nominatim")) throw new Error("offline");
    const query = new URL(url);
    assert.equal(query.searchParams.get("bounded"), "1");
    assert.equal(query.searchParams.get("amenity"), "pharmacy");
    return ok([{ osm_type: "node", osm_id: 45, lat: "-22.8584", lon: "-47.22", name: "Farmácia", address: { road: "Rua local" } }]);
  });
  const result = await service.collectionPoints({ lat: -22.85833, lng: -47.22 });
  assert.equal(result.points.length, 1);
  assert.equal(result.limited, true);
  assert.match(result.notice, /parcial/);
});
