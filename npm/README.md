# @brandzivio/jdb-wallet-crypto

A small helper for one step of a JDB Gaming seamless wallet endpoint: reading the `x` form parameter that JDB sends. Per JDB's Seamless Wallet documentation (v4.92.1), `x` is Base64 URL encoded and encrypted with AES-CBC-128, using the key and IV JDB gives your account. Your JSON reply does not have to be encrypted.

```js
const { decryptPayload } = require("@brandzivio/jdb-wallet-crypto");

app.post("/jdb/wallet", (req, res) => {
  const body = decryptPayload(req.body.x, { key: process.env.JDB_KEY, iv: process.env.JDB_IV });
  // body.action is 6, 9, 10, 11, 8 or 4 ... answer in under 3 seconds with HTTP 200 and a JDB status code
});
```

`encryptPayload(obj, { key, iv })` does the reverse, which is handy for tests.

## Limits, stated plainly

- Key and IV must be exactly 16 bytes each.
- It uses Node's default PKCS#7 padding. I have **not** run it against JDB's sandbox; confirm the padding and encoding details with JDB during onboarding.
- It does only the crypto step. Idempotency, ledger and timeouts are your wallet's job; see the [reference notes](https://github.com/brandzivio/jdb-seamless-wallet-reference).

Full write-up of the actions, retries and timing rules: [JDB Seamless Wallet API Guide](https://brandzivio.com/solutions/jdb-game-api-integration-services).

Brandzivio builds software only. JDB access and licences stay with the operator. MIT licensed.
