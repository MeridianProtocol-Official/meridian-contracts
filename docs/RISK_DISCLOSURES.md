# Meridian Protocol (MRDN) — Risk Disclosures

Technical risk disclosure, not legal advice and not a solicitation to buy tokens.

- **Smart-contract risk:** Independent third-party audit: not yet commissioned. Bugs in the contracts, compiler, wallets, explorers or integrations could cause loss.
- **Key and concentration risk:** The deployer wallet received the full 1,000,000,000 MRDN at deployment. 180,000,000 MRDN are in the vesting contract (300-day cliff, 1,095-day schedule). The staking owner and treasury owner are single keys. See `THREAT_MODEL.md`.
- **Treasury timelock:** Single-key control with a 72-hour public delay; it does not prevent theft by a patient attacker who holds the key.
- **Staking rewards:** Rewards are paid only from an owner-funded pool; if it runs dry, `claimReward()` reverts until refunded.
- **Immutability:** Vesting and timelock parameters cannot be changed after deployment.
- **Market and liquidity risk:** No liquidity, listing, price, yield or return is evidenced by this repository.
- **Legal and regulatory risk:** No jurisdiction-specific legal or tax opinion is included.
- **No endorsement:** Nothing here claims exchange approval, regulatory approval, guaranteed safety or guaranteed returns.
