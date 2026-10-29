// Reference sketch only. Not official JDB code and not run against JDB's sandbox.
// Shows the idempotency shape for Bet (9): one entry per transferId, repeats return the first result.

import { createDecipheriv } from "node:crypto";

type WalletResult = { status: string; balance: number; err_text: string };

// In production this is a database table with a UNIQUE index on transfer_id.
const ledger = new Map<string, WalletResult>();
const balances = new Map<string, number>();

// JDB sends the payload as form field `x`: Base64 URL encoded, AES-CBC-128.
// Key and IV (16 bytes each) come from your JDB environment settings.
export function decryptX(x: string, key: Buffer, iv: Buffer): unknown {
  const raw = Buffer.from(x.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const d = createDecipheriv("aes-128-cbc", key, iv);
  return JSON.parse(Buffer.concat([d.update(raw), d.final()]).toString("utf8"));
}

export function handleBet(req: { transferId: string; uid: string; amount: number }): WalletResult {
  const seen = ledger.get(req.transferId);
  if (seen) return seen; // repeated call: return the original result, never debit twice

  const balance = balances.get(req.uid) ?? 0;
  let result: WalletResult;
  if (balance < req.amount) {
    result = { status: "6006", balance, err_text: "Insufficient balance" };
  } else {
    const next = balance - req.amount;
    balances.set(req.uid, next);
    result = { status: "0000", balance: next, err_text: "" };
  }
  ledger.set(req.transferId, result);
  return result; // always HTTP 200 with a JDB status code, never a 4XX for business failures
}
