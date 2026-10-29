const test = require("node:test");
const assert = require("node:assert");
const { decryptPayload, encryptPayload } = require("../index.js");

const keys = { key: "0123456789abcdef", iv: "fedcba9876543210" };

test("round trip", () => {
  const body = { action: 9, transferId: "T1", uid: "player1", amount: 100 };
  const x = encryptPayload(body, keys);
  assert.ok(!/[+/=]/.test(x), "output is Base64 URL without padding");
  assert.deepStrictEqual(decryptPayload(x, keys), body);
});

test("rejects wrong key length", () => {
  assert.throws(() => encryptPayload({}, { key: "short", iv: keys.iv }), /16 bytes/);
});
