# Repository validation status

**Network focus:** BNB Smart Chain Mainnet (chain ID 56)

This page summarizes the reproducible checks included with the repository. It is not an audit report or a claim that the contracts are risk-free.

## Deployed contracts

| Contract | BNB Smart Chain Mainnet address |
|---|---|
| MRDN token | [`0xd4025a390a0b2a606f24Ea33A902D10D978715F2`](https://bscscan.com/address/0xd4025a390a0b2a606f24Ea33A902D10D978715F2#code) |
| MeridianStaking | [`0xE4679e407A4967f7182E87C1bc25Dcc786c3D3eb`](https://bscscan.com/address/0xE4679e407A4967f7182E87C1bc25Dcc786c3D3eb#code) |
| MeridianVesting | [`0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7`](https://bscscan.com/address/0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7#code) |
| MeridianTreasuryTimelock | [`0x921B238633241e14606217b9bFa2e2dE0Db67033`](https://bscscan.com/address/0x921B238633241e14606217b9bFa2e2dE0Db67033#code) |

The project team also supplied `0xAdecf71E361c1Efac662f83a517BBe26ccDC7fc7` as its BNB Smart Chain presale contract and reports buy-only operation with selling disabled. This address was not independently verified in this validation run; its source, ABI, deployment receipt, and tests are not included in this repository. It is outside the compile and test results below.

## Build and tests

- Solidity 0.8.24; Hardhat 2.29.0; OpenZeppelin Contracts 5.6.1.
- BNB Smart Chain mainnet and testnet are explicitly configured in `hardhat.config.cjs` with chain IDs 56 and 97.
- `npm run compile` compiled 18 Solidity files successfully on 2026-10-25.
- The four test suites passed: 34 tests total (token 5, staking 9, vesting 7, timelock 13). Full output: [`evidence/test-output.txt`](evidence/test-output.txt).
- Solidity source SHA-256 values are recorded in [`evidence/source-checksums.txt`](evidence/source-checksums.txt).

## Independent security review

No independent third-party audit has been commissioned. [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) is internal analysis, not an audit. See [`docs/SECURITY_REVIEW.md`](docs/SECURITY_REVIEW.md) and [`docs/RISK_DISCLOSURES.md`](docs/RISK_DISCLOSURES.md) before interacting with the contracts.

The BscScan links above are provided for independent review. This validation run checked compilation, tests, and local source checksums; it did not independently fetch and compare the explorer source pages.
