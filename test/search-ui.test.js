import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
function setup({ cep = "13183-627", postalFails = false, deviceFails = false } = {}) {
  const nodes = new Map();
  function element() { return { value: "", textContent: "", innerHTML: "", style: {}, disabled: false, handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; }, setAttribute() {}, append() {} }; }
  for (const id of ["#cep", "#cep-form", "#location-button", "#combined-button", "#status", "#place-list", "#search-reference"]) nodes.set(id, element());
  nodes.get("#cep").value = cep;
  const requests = [], geoCalls = [];
  const context = vm.createContext({
    document: { querySelector: id => nodes.get(id), querySelectorAll: () => [nodes.get("#location-button"), nodes.get("#combined-button")], createElement: element },
    window: {}, AbortController,
    navigator: { geolocation: { getCurrentPosition(success, failure, options) { geoCalls.push(options); deviceFails ? failure({ code: 1 }) : success({ coords: { latitude: -22.9, longitude: -47.1, accuracy: 12 } }); } } },
    fetch: async url => {
      requests.push(url);
      if (url.includes("/api/cep/")) return { ok: !postalFails, json: async () => postalFails ? { error: "CEP indisponível" } : { address: "Hortolândia, SP", coordinates: { lat: -22.85, lng: -47.22 }, notice: "Referência aproximada" } };
      return { ok: true, json: async () => ({ origin: { lat: -22.9, lng: -47.1 }, points: [], notice: "Busca concluída" }) };
    }
  });
  vm.runInContext(source, context);
  return { nodes, requests, geoCalls, run: mode => vm.runInContext(`search('${mode}')`, context) };
}
test("CEP alone never asks for device location", async () => {
  const ui = setup(); await ui.run("cep");
  assert.equal(ui.geoCalls.length, 0);
  assert.ok(ui.requests.includes("/api/collection-points?near=-22.85,-47.22"));
  assert.match(ui.nodes.get("#search-reference").textContent, /aproximada/);
});
test("device alone ignores even an invalid CEP and requests a fresh accurate position", async () => {
  const ui = setup({ cep: "123" }); await ui.run("device");
  assert.equal(ui.requests.some(url => url.includes("/api/cep/")), false);
  assert.ok(ui.requests.includes("/api/collection-points?near=-22.9,-47.1"));
  assert.equal(ui.geoCalls[0].enableHighAccuracy, true);
  assert.equal(ui.geoCalls[0].maximumAge, 0);
});
test("combined search uses device position and explains its priority over CEP", async () => {
  const ui = setup(); await ui.run("combined");
  assert.equal(ui.geoCalls.length, 1);
  assert.ok(ui.requests.includes("/api/cep/13183627"));
  assert.ok(ui.requests.includes("/api/collection-points?near=-22.9,-47.1"));
  assert.match(ui.nodes.get("#search-reference").textContent, /CEP não altera essa posição/);
});
test("combined search recovers using CEP if location is denied", async () => {
  const ui = setup({ deviceFails: true }); await ui.run("combined");
  assert.ok(ui.requests.includes("/api/collection-points?near=-22.85,-47.22"));
  assert.match(ui.nodes.get("#search-reference").textContent, /não autorizada/);
});
test("combined search recovers using device if CEP fails", async () => {
  const ui = setup({ postalFails: true }); await ui.run("combined");
  assert.ok(ui.requests.includes("/api/collection-points?near=-22.9,-47.1"));
  assert.match(ui.nodes.get("#search-reference").textContent, /CEP indisponível/);
});
test("failure restores controls and presents an actionable error", async () => {
  const ui = setup({ deviceFails: true, postalFails: true }); await ui.run("combined");
  assert.match(ui.nodes.get("#status").textContent, /CEP indisponível/);
  assert.equal(ui.nodes.get("#location-button").disabled, false);
  assert.equal(ui.requests.some(url => url.includes("collection-points")), false);
});
