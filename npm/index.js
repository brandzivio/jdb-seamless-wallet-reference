"use strict";
const { createCipheriv, createDecipheriv } = require("node:crypto");

function toBuf16(value, name) {
  const buf = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  if (buf.length !== 16) throw new Error(`${name} must be exactly 16 bytes for AES-128-CBC (got ${buf.length})`);
  return buf;
}

function fromBase64Url(s) {
  return Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function toBase64Url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decode the x form parameter (Base64 URL) and decrypt it with AES-128-CBC. Returns the parsed JSON object. */
function decryptPayload(x, { key, iv }) {
  const d = createDecipheriv("aes-128-cbc", toBuf16(key, "key"), toBuf16(iv, "iv"));
  const plain = Buffer.concat([d.update(fromBase64Url(x)), d.final()]).toString("utf8");
  return JSON.parse(plain);
}

/** Encrypt an object the same way (AES-128-CBC, Base64 URL). Useful for tests and for calls you send to JDB. */
function encryptPayload(obj, { key, iv }) {
  const c = createCipheriv("aes-128-cbc", toBuf16(key, "key"), toBuf16(iv, "iv"));
  return toBase64Url(Buffer.concat([c.update(JSON.stringify(obj), "utf8"), c.final()]));
}

module.exports = { decryptPayload, encryptPayload };
