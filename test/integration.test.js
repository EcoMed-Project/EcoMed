import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

let child;
const origin = "http://127.0.0.1:31397";
before(async () => {
  child = spawn(process.execPath, ["server.js"], { env: { ...process.env, PORT: "31397" }, stdio: ["ignore", "pipe", "pipe"] });
  await Promise.race([once(child.stdout, "data"), once(child, "error").then(([error]) => { throw error; }), new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error("Server startup timeout")), 15000); timer.unref(); })]);
});
after(() => child?.kill());

test("all public screens load shared design, official logo and existing local assets", async () => {
  for (const route of ["/", "/descarte.html", "/recipiente.html", "/aprender.html", "/sobre.html", "/privacidade.html"]) {
    const response = await fetch(origin + route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.ok(html.includes('/assets/logo-ecomed.jfif'), route);
    assert.ok(html.includes('/favicon.png'), route);
    assert.ok(html.includes('/styles.css') && html.includes('/ui.js'), route);
    assert.ok(!html.includes('favicon.svg'), route);
    for (const [, asset] of html.matchAll(/(?:src|href)="(\/[^"#]*)"/g)) {
      assert.equal((await fetch(origin + asset)).status, 200, route + " -> " + asset);
    }
  }
});
test("container blocks unknown material and missing safety conditions", async () => {
  for (const body of [{material:"unknown",cameraReady:true,binsAvailable:true}, {material:"glass",cameraReady:false,binsAvailable:true}, {material:"glass",cameraReady:true,binsAvailable:false}]) {
    const response = await fetch(origin + "/api/container/decision", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    assert.equal(response.status,409);
    assert.equal((await response.json()).allowed,false);
  }
});
test("container selects each supported compartment", async () => {
  for (const material of ["glass","packaging"]) {
    const response = await fetch(origin + "/api/container/decision", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({material,cameraReady:true,binsAvailable:true})});
    assert.equal(response.status,200);
    assert.equal((await response.json()).allowed,true);
  }
});
test("invalid CEP and unknown page have explicit HTTP errors", async () => {
  assert.equal((await fetch(origin + "/api/cep/123")).status,400);
  assert.equal((await fetch(origin + "/missing-page")).status,404);
});
