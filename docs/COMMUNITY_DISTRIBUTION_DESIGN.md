# Community & Ecosystem Allocation — Distribution Mechanism Design

**Status: Designed, not yet deployed.** This document describes the
intended mechanism for distributing the 400,000,000 MRDN (40%) Community
& Ecosystem allocation. Publishing this design is a step toward
"Confirmed" status, but the honest status of this category remains
**Planned** until the described contract(s) are actually written,
tested, deployed, and verified on-chain — consistent with this project's
rule that nothing is marked complete until it verifiably is.

## Why a designed-but-undeployed plan is still worth publishing

An undocumented "TBD" gives a reader nothing to evaluate. A published
design — even before deployment — lets the community, investors, and
future auditors see exactly what is intended, hold the project
accountable to it, and flag concerns before real tokens are committed to
a mechanism. This is the same transparency-first approach used
throughout this project's documentation.

## Proposed mechanism

### Structure: Claim-based, milestone-gated release

Rather than a single vesting schedule (appropriate for a single
beneficiary like the Founder/Team allocation), the Community & Ecosystem
allocation is better served by a **claims contract** that releases tokens
in tranches tied to specific, publicly announced programs:

1. **Tranche-based allocation** — Total 400,000,000 MRDN is divided into
   named tranches as programs are defined (e.g., "Testnet Participation
   Rewards," "Staking Launch Incentive," "Ecosystem Grants Pool"). No
   tranche is funded or opened until its program is publicly described.

2. **Per-tranche Merkle-claim contract** — For each tranche, eligible
   addresses and amounts are published as a Merkle tree (a standard,
   widely-used, gas-efficient pattern for large-scale token
   distributions). The Merkle root is published on-chain; eligible users
   call `claim()` themselves — the project never pushes tokens to
   individual wallets, which avoids both the gas cost and the trust
   assumption of a manual distribution.

3. **Public eligibility criteria, published before the snapshot** —
   Every tranche's eligibility rules (e.g., "staked MRDN before block X,"
   "held MRDN for at least Y days") are published before any snapshot is
   taken, not decided retroactively.

4. **Unclaimed-token handling, decided per tranche** — Each tranche
   announcement will state up front what happens to unclaimed tokens
   after a claim window closes (commonly: return to an unallocated pool
   for a future tranche, rather than reverting to the founder).

### What this deliberately does NOT include (for now)

- No fixed calendar schedule — because premature commitments to specific
  dates for specific programs would be exactly the kind of promise this
  project avoids making before the underlying program actually exists.
- No governance voting mechanism for tranche design — this remains a
  founder decision at the current, pre-formalized-community stage, and
  is disclosed as such rather than implying a DAO-like process that
  doesn't exist.

## Path to "Confirmed" / "Live" status

1. Write and test the Merkle-claim contract (reusable template for every
   tranche — this is a well-understood, widely-audited pattern, similar
   in spirit to how MeridianStaking reused a standard accounting model
   rather than inventing new mechanics).
2. Deploy the first tranche only once a real, specific program (e.g., a
   staking-launch incentive) is ready to be publicly announced with real
   eligibility criteria.
3. Update this document, the Tokenomics page, and the Roadmap the moment
   any tranche moves from "designed" to "deployed and verified" — never
   in advance of the deployment itself.