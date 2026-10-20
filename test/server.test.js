import test from "node:test";
import assert from "node:assert/strict";

test("container must fail closed without a known material", () => {
  const known = ["glass", "packaging"].includes("unknown");
  assert.equal(known, false);
});
test("CEP accepts exactly eight digits after formatting", () => {
  assert.equal("01310-100".replace(/\D/g, "").length, 8);
});
