# Meridian Protocol — Threat Model

**Scope:** LaunchToken.sol (MRDN), MeridianStaking.sol, MeridianVesting.sol
**Status:** Internal, non-certified analysis. This is NOT a substitute for
an independent professional audit — see each contract's own
SECURITY_REVIEW.md for that distinction. This document exists to make a
future professional audit faster and cheaper by pre-identifying the
attack surface, and to give any reader (investor, auditor, community
member) a structured view of what could go wrong and why it doesn't.

Each entry follows: **Asset at risk → Attack vector → Likelihood →
Impact → Mitigation → Residual risk**.

---

## 1. LaunchToken.sol (MRDN)

### 1.1 Unauthorized minting
- **Asset:** Total supply integrity
- **Attack vector:** A hidden or exploitable mint function inflates supply
- **Likelihood:** Very low — no mint function exists anywhere in the contract
- **Impact if successful:** Critical — supply inflation, holder dilution
- **Mitigation:** Built directly on OpenZeppelin's standard ERC-20 base,
  entire supply minted once at construction, no mint function defined
- **Residual risk:** None identified beyond OpenZeppelin base-contract
  risk, which is separately, widely audited by the broader ecosystem

### 1.2 Transfer manipulation (fee-on-transfer, blacklist, pause)
- **Asset:** Holder ability to freely transfer tokens
- **Attack vector:** Hidden transfer hook that taxes, blocks, or pauses
  transfers unexpectedly
- **Likelihood:** Very low — no such hooks exist in the deployed code
- **Impact if successful:** High — trading disruption, trapped funds
- **Mitigation:** No owner variable, no pause function, no blacklist
  mapping, no custom `_update`/`_transfer` override beyond the OZ base
- **Residual risk:** None identified in current source

### 1.3 Concentration / single-holder risk
- **Asset:** Market stability, holder trust
- **Attack vector:** The address holding undistributed supply sells or
  moves a large portion at once
- **Likelihood:** Was previously "certain to exist," now partially
  mitigated
- **Impact if successful:** High — severe price impact if/when a market
  exists
- **Mitigation:** 180,000,000 MRDN (18%) is now confirmed on-chain inside
  MeridianVesting (0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7), verified
  on BscScan, with a 10-month cliff and 3-year linear release. Funding
  transaction: 0x38666dfedef6f32c745eef55d26d9b889306f23b9ca7d7dcda45cbbdbde20e4e.
  This portion cannot be moved by anyone, including the beneficiary,
  ahead of the published schedule.
- **Residual risk:** **Partially open.** The remaining 820,000,000 MRDN (82%) —
  Community, Liquidity, Treasury, Marketing, Reserve allocations — is
  still held in a single, non-vested address as of this writing. This is
  the single largest unresolved item in this threat model and should be
  addressed (via additional timelocks, a multisig, or transparent
  publication of a distribution schedule) before any large-scale public
  marketing of the token.

---

## 2. MeridianStaking.sol

### 2.1 Reentrancy on stake/claim/unstake
- **Asset:** Staked principal and reward pool balance
- **Attack vector:** A malicious token or callback re-enters a function
  mid-execution to drain funds
- **Likelihood:** Low — MRDN itself has no callback hooks, but the
  contract should be resistant even to unusual future ERC-20-like tokens
- **Impact if successful:** Critical — direct fund loss
- **Mitigation:** `nonReentrant` modifier (OpenZeppelin ReentrancyGuard)
  on `stake`, `unstake`, `claimReward`, and `fundRewardPool`; state is
  updated before external calls (checks-effects-interactions)
- **Residual risk:** Low

### 2.2 Reward-accounting manipulation
- **Asset:** Fairness of reward distribution across stakers
- **Attack vector:** Flash-stake immediately before a reward-rate change
  or right before a large unstake, to unfairly capture rewards
- **Likelihood:** Low-medium — the reward-per-token pattern used here is
  the same one used by widely-deployed contracts (e.g. Synthetix
  StakingRewards) and is a known-quantity design
- **Impact if successful:** Medium — reward unfairness between stakers,
  not a fund-safety issue (rewards can only be paid from the pool the
  owner has funded)
- **Mitigation:** Standard `rewardPerToken()` accumulator pattern,
  updated via the `updateReward` modifier before any state-changing action
- **Residual risk:** Low-medium — not independently audited yet

### 2.3 Owner privilege escalation
- **Asset:** Staker principal, reward pool
- **Attack vector:** Owner key compromise used to drain user funds
- **Likelihood:** Depends entirely on owner key hygiene (see 4.x below)
- **Impact if successful:** Would be Critical if possible — but see
  mitigation
- **Mitigation:** Owner's ONLY two functions are `setRewardRate` and
  `fundRewardPool`. Neither can move staker principal or withdraw
  reward-pool funds to the owner. There is no `sweep`, `rescue`, or
  `emergencyWithdraw` function anywhere in the contract — confirmed by
  both manual review and an automated test asserting these functions do
  not exist.
- **Residual risk:** Even full owner key compromise cannot directly drain
  user funds under this design. Residual risk is limited to a compromised
  owner setting the reward rate to 0 (denial of new rewards, not theft)

### 2.4 Reward pool depletion / griefing
- **Asset:** Staker ability to claim earned rewards
- **Attack vector:** Reward pool runs dry before all accrued rewards are
  claimed
- **Likelihood:** Medium — depends entirely on the owner keeping the pool
  funded relative to the active reward rate
- **Impact if successful:** Low-medium — `claimReward()` simply reverts
  until re-funded; no permanent loss, but a real user-experience and
  trust issue if not disclosed
- **Mitigation:** `claimReward()` explicitly checks `reward <=
  rewardPoolBalance` and reverts cleanly rather than under-paying
- **Residual risk:** Operational risk, not a code vulnerability — must be
  actively monitored and disclosed to users (already flagged in
  STAKING_CONTRACT.md)

---

## 3. MeridianVesting.sol

### 3.1 Wrong beneficiary or schedule at deployment
- **Asset:** The entire 180,000,000 MRDN allocation
- **Attack vector:** Human error — a typo'd address or wrong duration
  value at deployment, which cannot be corrected afterward
- **Likelihood:** Low if the confirmation protocol is followed, otherwise
  high — this is the single highest-consequence risk in this entire
  project, precisely because the contract is intentionally immutable
- **Impact if successful:** Critical and irreversible
- **Mitigation:** A documented, mandatory beneficiary-confirmation
  protocol (independent address verification by two parties before
  deployment) plus mandatory testnet rehearsal with the exact same
  parameter values before mainnet deployment
- **Residual risk:** Cannot be reduced to zero by code — this is a
  process risk, not a code risk, and depends on discipline every time
  this contract pattern is reused

### 3.2 Permissionless release() abuse
- **Asset:** Gas costs, unexpected calls
- **Attack vector:** Since anyone can call `release()`, could this be
  abused?
- **Likelihood:** N/A as an attack — there is no way to benefit from
  calling it as anyone other than the fixed beneficiary
- **Impact if successful:** None — funds can only ever go to the one
  fixed beneficiary address, regardless of who calls the function
- **Mitigation:** By design — this is intentionally permissionless
  because it is safe to be
- **Residual risk:** None

### 3.3 Total-allocation manipulation via unexpected token transfers
- **Asset:** Vesting schedule accuracy
- **Attack vector:** Someone other than the project sends additional MRDN
  directly to the vesting contract, changing `totalAllocation()` and
  therefore the vesting curve
- **Likelihood:** Low — would require someone to voluntarily send tokens
  they own to this address with no benefit to themselves
- **Impact if successful:** Low-medium — would accelerate the
  beneficiary's effective vesting slightly by increasing the allocation
  base, not a fund-safety issue for anyone else
- **Mitigation:** None currently — accepted as a low-severity, low-
  likelihood tradeoff of a fully permissionless, mint-free design that
  avoids more complex, higher-risk allocation-tracking logic
- **Residual risk:** Low — documented here rather than silently accepted

---

## 4. Cross-Cutting Risks (all contracts)

### 4.1 Owner/deployer key compromise (general)
- **Asset:** Everything the compromised key can control
- **Attack vector:** Phishing, malware, seed phrase exposure, social
  engineering
- **Likelihood:** Medium — the single largest realistic risk across this
  entire project, as with virtually all early-stage crypto projects
- **Impact if successful:** Severe, scope depends on which functions the
  compromised key can call (see contract-specific limits above)
- **Mitigation:** Fresh, single-purpose beneficiary wallet used for
  vesting (not reused from daily-operations hot wallet); recommendation
  on file to move remaining un-vested supply to a multisig once a second
  trusted party exists
- **Residual risk:** **Open and significant.** Day-to-day operational
  wallets (deployer, staking owner) remain single-key. This is disclosed
  honestly rather than implied otherwise.

### 4.2 Lack of independent manual audit
- **Asset:** Confidence in all of the above
- **Attack vector:** N/A — this is a disclosure item, not an attack
- **Likelihood:** N/A
- **Impact:** Unknown, undiscovered vulnerability classes that manual
  human review catches and automated tools (SolidityScan) do not
- **Mitigation:** Automated SolidityScan analysis completed for both live
  contracts (95.57/100 token, 90.77/100 staking), zero Critical/High
  findings on either — a genuine but partial signal
- **Residual risk:** **Open until an independent manual audit is
  actually commissioned and published.** This document does not change
  that status.

---

## Summary Table

| # | Risk | Status |
|---|---|---|
| 1.3 | 18% vested & funded on-chain; 82% still in single address | 🟡 Partially mitigated |
| 4.1 | Daily-operations wallets remain single-key | 🔴 Open |
| 4.2 | No independent manual audit yet | 🔴 Open |
| 2.4 | Reward pool depletion (operational) | 🟡 Monitor |
| 3.3 | Unsolicited token transfers to vesting contract | 🟡 Low severity |
| 1.1, 1.2, 2.1, 2.2, 2.3, 3.1 (post-protocol), 3.2 | Code-level risks | 🟢 Mitigated by design |

This document will be updated as each open item is addressed, following
the same rule as every other status in this project's documentation:
nothing is marked resolved until it verifiably is.
