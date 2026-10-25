# MeridianVesting — Final Deployment Record

**Status:** deployed, source-verified, and funded on BSC Mainnet  
**Network:** BNB Smart Chain Mainnet (chain ID 56)  
**Readback captured:** block `116404847`, timestamp `1786942914`

## Mainnet addresses

| Item | Value |
|---|---|
| MRDN token | [`0xd4025a390a0b2a606f24Ea33A902D10D978715F2`](https://bscscan.com/address/0xd4025a390a0b2a606f24Ea33A902D10D978715F2) |
| Vesting contract | [`0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7`](https://bscscan.com/address/0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7) |
| Beneficiary | `0x56B6e8947ea0666108802E4BE12A46E204E7cEee` |
| Source verification | [Verified source](https://bscscan.com/address/0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7#code) |

## Immutable schedule

- Start timestamp: `1786872990` (deployment block timestamp)
- Cliff duration: `25,920,000` seconds (300 days)
- Total duration: `94,608,000` seconds (1,095 days / 3 years)
- Vesting accrues from the start timestamp, but `release()` is gated until the cliff.
- `release()` is permissionless, but tokens can only transfer to the immutable beneficiary.
- The contract has no owner, admin, pause, redirect, rescue, or upgrade function.

## Final mainnet funding

- Allocation: **180,000,000 MRDN**
- Funding transaction:
  [`0x38666dfedef6f32c745eef55d26d9b889306f23b9ca7d7dcda45cbbdbde20e4e`](https://bscscan.com/tx/0x38666dfedef6f32c745eef55d26d9b889306f23b9ca7d7dcda45cbbdbde20e4e)
- Funding receipt status: successful (`1`)
- Vesting balance after funding: exactly `180,000,000 MRDN`
- No release has been executed on mainnet.

## Mainnet read-contract values

| Read method | Raw value | Human-readable |
|---|---:|---:|
| `beneficiary()` | `0x56B6e8947ea0666108802E4BE12A46E204E7cEee` | fixed beneficiary |
| `token()` | `0xd4025a390a0b2a606f24Ea33A902D10D978715F2` | MRDN |
| `cliffDuration()` | `25920000` | 300 days |
| `totalDuration()` | `94608000` | 1,095 days |
| `totalAllocation()` | `180000000000000000000000000` | 180,000,000 MRDN |
| `totalReleased()` | `0` | 0 MRDN |
| `vestedAmount()` | `0` | 0 MRDN |
| `releasable()` | `0` | 0 MRDN |
| `startTimestamp()` | `1786872990` | deployment block timestamp |

The machine-readable copy is `evidence/vesting-mainnet-readback.json`.

## Deployment transaction

[`0xbd2f449028a8360afc8e9318b7e9fb5d650c4822ae86988b87c6e7dab686cf45`](https://bscscan.com/tx/0xbd2f449028a8360afc8e9318b7e9fb5d650c4822ae86988b87c6e7dab686cf45)  
Receipt status: successful (`1`), block `116249501`.

## Risk disclosure

This contract was tested locally and rehearsed on BSC Testnet, but it has not
received an independent third-party audit. The contract is immutable, so an
incorrect constructor argument cannot be repaired after deployment.