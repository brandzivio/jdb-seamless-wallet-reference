# JDB seamless wallet: reference notes and handler sketch

Notes on how an operator-side wallet endpoint should behave when JDB Gaming calls it, written from JDB's public Seamless Wallet documentation (v4.92.1). This is a reference sketch, not official JDB code, and it has not been run against JDB's sandbox. Keys, API address and environment settings come from JDB after onboarding.

Maintained by [Brandzivio](https://brandzivio.com), a software company in Gurugram, India.

## What the wallet must answer

| Action | What JDB asks | Key request fields | What the wallet does |
|---|---|---|---|
| 6 Get Balance | Player's current balance | uid, currency, gType, mType, ts | Returns status 0000 and the balance. Read-only, safe to repeat. |
| 9 Bet | Debit a stake | transferId, uid, amount (always positive), gameRoundSeqNo, gType, mType | Debits once, returns 0000 and the new balance, or 6006 if the balance is insufficient. |
| 10 Settle | Credit the result of earlier bets | transferId, refTransferIds, amount, historyId, win, netWin, roundClosed | Credits against the matching bets. A repeat of a processed settle returns 0000 without crediting again. |
| 11 Cancel Bet | Reverse a Bet that did not complete | the Bet's transferId | Reverses the debit once. A cancel for an unknown bet is recorded and flagged. |
| 8 BetNSettle | Debit and credit in one call (fast rounds) | transferId, historyId, bet (negative), win, netWin, mb, reportDate, gameDate | One atomic ledger entry. 6006 if the balance is below the required amount. |
| 4 Cancel BetNSettle | Reverse an Action 8 that did not complete | the original transferId | Reverses the combined entry once. |

Actions 12 to 16 (rewards, deposit and withdraw adjustments, free spins) apply only where your JDB contract uses them. Action 21 launches a game and Action 47 launches the demo.

## Transport rules to design around

- JDB sends a POST with one parameter, `x`. Base64 URL-decode it, then decrypt with AES-CBC-128 using the key and IV JDB gives your account.
- Your response is plain JSON (`status`, `balance`, `err_text`). JDB does not require it to be encrypted.
- Respond within 3 seconds. Slower counts as a timeout, so the request path should do one indexed balance update and nothing else.
- An HTTP 4XX counts as a failure and JDB sends no cancel. Answer business failures with HTTP 200 and a JDB status code.

## When JDB does not get an answer

| Situation | What JDB does | What the wallet does |
|---|---|---|
| No valid answer to a Bet (9) | Sends Cancel Bet (11) after 1 minute | Matches the cancel to the bet and reverses it once |
| No valid answer to a BetNSettle (8) | Sends Cancel BetNSettle (4) after 1 minute | Reverses the combined entry once |
| Settle (10) fails or status is not 0000 | Resends about every minute for up to an hour | Credit applied once; every repeat returns 0000 |
| Balance too low | Expects status 6006 | Returns 6006, ledger unchanged |

JDB's page does not say how it detects duplicate transfer IDs. Confirm that rule with JDB during onboarding, and key your idempotency check on `transferId` and `historyId` either way.

## Handler sketch

[`wallet-handler.ts`](wallet-handler.ts) shows the idempotency shape: one ledger table keyed on transfer ID, a result stored with each entry, and repeated calls returning the first result.

## Full write-up

The longer guide covers the Action 21 launch fields, slots versus fishing payloads, and how this wallet sits inside a multi-provider platform: [JDB game API integration guide](https://brandzivio.com/solutions/jdb-game-api-integration-services). For other providers on the same wallet layer, see the [casino game API integration overview](https://brandzivio.com/solutions/casino-game-api-integration-company).

## Scope

Brandzivio builds software only. JDB access, licences and legal compliance stay with the operator. Nothing here is legal advice.

MIT licensed.
