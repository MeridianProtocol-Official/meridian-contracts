# MeridianTreasuryTimelock — Contract Notes

## What this is — and is NOT

This is a **single-key-controlled** contract with a mandatory public delay
on withdrawals. It is honestly disclosed as such:

- ✅ Provides: advance public warning before any treasury funds move
  (minimum 72 hours between announcement and execution), an immutable
  event trail of every announcement/cancellation/execution, and the
  structural inability to move funds instantly under any circumstance.
- ❌ Does NOT provide: multi-party governance, protection against the
  single key being compromised (a compromised key can still eventually
  withdraw everything — it just can't do it instantly or silently), or
  decentralized trust of any kind.

**Do not describe this as a "multisig" or as "decentralized treasury
management" anywhere — it is neither.** The correct, accurate description
is: "single-key controlled, with a mandatory 72-hour public announcement
delay on all withdrawals."

## What it does

1. Owner calls `announceWithdrawal(to, amount)` — this only records intent
   and starts a public countdown. No funds move.
2. Anyone (community, investors, monitoring tools) can watch the
   `WithdrawalAnnounced` event and the `timeUntilExecutable()` view
   function to see exactly what's coming and when.
3. After `minDelay` (72 hours, fixed at deployment) has passed, the owner
   may call `executeWithdrawal()` to actually transfer the announced
   amount to the announced address.
4. The owner may `cancelWithdrawal()` at any point before execution.
5. Ownership may be transferred to a Safe or another explicitly approved
   controller with the standard OpenZeppelin `transferOwnership()`
   function. `renounceOwnership()` is intentionally disabled because
   renouncing would permanently lock all treasury funds.

## Known limitations — disclosed honestly

- **Not audited.** Manually reviewed and covered by an automated test
  suite; treat as PENDING an independent audit, same as every other
  contract in this project.
- **Single point of failure remains.** If the owner key is compromised,
  the attacker can announce a withdrawal and simply wait out the 72
  hours — the delay buys reaction time, it does not prevent theft by a
  patient attacker with full key control.
- **Ownership is transferable.** The initial owner can migrate control to
  a Safe or another explicitly approved address. This does not change the
  immutable withdrawal delay.
- **Ownership cannot be renounced.** This prevents a permanent loss of
  control over the treasury and is intentional for a contract holding
  real funds.
- **Only one withdrawal pending at a time**, by design, to keep this
  simple to monitor. A new announcement silently replaces an old one
  (this is disclosed in the contract's NatSpec) — watch for
  `WithdrawalAnnounced` events, not just the first one you saw.
- **This can be strengthened later** by setting `initialOwner_` to a Safe
  (multisig) address at deployment instead of a single EOA — the
  contract doesn't care which type of address owns it. If/when a second
  trusted party exists, transferring ownership to a Safe is a natural
  migration path.

## Deployment status
Deployed to BNB Smart Chain Mainnet at `0x921B238633241e14606217b9bFa2e2dE0Db67033`
with a 72-hour delay (259200 s). Funding is a separate manual transfer; the
handoff record available when this repo was assembled showed a treasury balance
of `0`. Check `treasuryBalance()` on BscScan for the current value.
`test/MeridianTreasuryTimelock.test.js` has 13 test cases; no recorded passing
run of this suite exists in the project materials, so run `npm run test:log`.
