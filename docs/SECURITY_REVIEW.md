# Security Review Status

**Independent third-party audit: not yet commissioned.**

None of the four contracts has had an independent third-party audit. A BscScan
"source verified" mark only means the published source matches the deployed
bytecode. `THREAT_MODEL.md` is the project's internal analysis and is not an audit.

## Contracts in scope

| Contract | Admin surface (from the source) |
|---|---|
| `LaunchToken` (MRDN) | None. Fixed supply minted once in the constructor; no owner, mint, burn, pause, tax or blacklist. |
| `MeridianStaking` | Owner can `setRewardRate` and `fundRewardPool` only. Cannot move staker principal; no sweep/rescue. |
| `MeridianVesting` | None. Immutable beneficiary and schedule; `release()` is permissionless but pays only the beneficiary. |
| `MeridianTreasuryTimelock` | Single owner key. Withdrawals need an on-chain announcement and a 72-hour delay. `renounceOwnership` reverts. Not a multisig. |

## Compiler settings (must match for bytecode reproduction)

| Contract | Solidity | Optimizer | EVM |
|---|---|---|---|
| LaunchToken, MeridianStaking, MeridianTreasuryTimelock | 0.8.24 | on, 200 runs | paris |
| MeridianVesting | 0.8.24 | **off** | compiler default |

OpenZeppelin Contracts 5.6.1. `hardhat.config.cjs` applies the Vesting settings
through a per-file override.

## Tests

`test/` holds 34 test cases: token 5, staking 9, vesting 7, timelock 13. A full
run on 2026-10-25 passed all 34 cases; the captured output is in
`evidence/test-output.txt`. Run `npm test`, or `npm run test:log` to save a new
run to that evidence path.

## Known open items

- No independent audit (see above).
- Owner / deployer keys are single-key; see `THREAT_MODEL.md` section 4.1.
- `THREAT_MODEL.md` covers token, staking and vesting; it does not yet cover the treasury timelock.
- Vesting and timelock constructor values are immutable.
