# Meridian Protocol (MRDN) — Smart Contracts

Source, tests, scripts and deployment records for the Meridian Protocol contracts on **BNB Smart Chain Mainnet (chain ID 56)**.

Website: https://meridianprotocol.site

## Deployed contracts (BNB Smart Chain Mainnet, chain ID 56)

| Contract | Source | Mainnet address (BscScan, source verified) |
|---|---|---|
| MRDN token (BEP-20, 1,000,000,000 fixed supply, 18 decimals) | `contracts/LaunchToken.sol` | [`0xd4025a390a0b2a606f24Ea33A902D10D978715F2`](https://bscscan.com/address/0xd4025a390a0b2a606f24Ea33A902D10D978715F2#code) |
| MeridianStaking | `contracts/MeridianStaking.sol` | [`0xE4679e407A4967f7182E87C1bc25Dcc786c3D3eb`](https://bscscan.com/address/0xE4679e407A4967f7182E87C1bc25Dcc786c3D3eb#code) |
| MeridianVesting (180,000,000 MRDN) | `contracts/MeridianVesting.sol` | [`0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7`](https://bscscan.com/address/0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7#code) |
| MeridianTreasuryTimelock (72-hour delay) | `contracts/MeridianTreasuryTimelock.sol` | [`0x921B238633241e14606217b9bFa2e2dE0Db67033`](https://bscscan.com/address/0x921B238633241e14606217b9bFa2e2dE0Db67033#code) |

Deployment transactions recorded in `evidence/`: token `0xd825e375…8b8d395b09` (block 114774718), staking `0x85698578…c202a7ef4` (block 115487272), vesting `0xbd2f4490…86cf45` (block 116249501), vesting funding `0x38666dfe…de20e4e` (block 116403168). The timelock deployment transaction hash is not part of the recorded evidence; see the address page on BscScan.

Key parameters: staking token = MRDN, staking owner and timelock owner `0x9954585529c7FC22b47E6562C9726082F810903C`; vesting beneficiary `0x56B6e8947ea0666108802E4BE12A46E204E7cEee`, cliff 25,920,000 s (300 days), total 94,608,000 s (1,095 days), start timestamp 1786872990; timelock delay 259,200 s.

### Source checksums (SHA-256)

```
b01280f003390648bd40d92c89ff804baafb7cff1fefd495d0346d2e91cde368  contracts/LaunchToken.sol
c0cc3962cd45dae478fbf752761bb967527fb818ffb30526406843c73644583b  contracts/MeridianStaking.sol
b3bcb8bc6bbb25c2ed3c84f019b8be16911b3c57b039fc5087bec51134797df6  contracts/MeridianVesting.sol
7a97166410e66c9d05abdf4127d27e2292bc2a39c8b3a188d248f5e3660cfb9d  contracts/MeridianTreasuryTimelock.sol
```

### Compiler settings

Solidity 0.8.24, OpenZeppelin Contracts 5.6.1. Token, staking and timelock: optimizer on (200 runs), EVM `paris`. **Vesting: optimizer off**, default EVM. `hardhat.config.cjs` applies both.

## Security status

- Independent third-party audit: **not yet commissioned**
- Internal analysis: [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md) (internal, not an audit)
- Status and open items: [`docs/SECURITY_REVIEW.md`](docs/SECURITY_REVIEW.md); read [`docs/RISK_DISCLOSURES.md`](docs/RISK_DISCLOSURES.md) before interacting with the contracts.

## Repository layout

```
contracts/    The four deployed contracts
contracts/mocks/RehearsalToken.sol   Test-only token (never deploy to mainnet)
test/         Hardhat tests, one file per contract
scripts/      token/, staking/, vesting/, treasury/ (preflight, deploy, verify, ...) and run-tests-with-log.cjs
docs/         SECURITY_REVIEW, RISK_DISCLOSURES, THREAT_MODEL, STAKING_CONTRACT,
              VESTING_CONTRACT, TREASURY_TIMELOCK, COMMUNITY_DISTRIBUTION_DESIGN
evidence/     Small deployment receipts and read-backs (JSON/MD), token ABI
hardhat.config.cjs, package.json, package-lock.json, .env.example, LICENSE
```

## Build and test

```bash
npm ci
npm run compile
npm test            # or: npm run test:log  (also saves evidence/test-output.txt)
```

`test/` contains 34 test cases: token 5, staking 9, vesting 7, timelock 13.

## Scripts

Pattern: `npm run <action>:<contract>:<network>`. Every contract has a read-only `preflight` for testnet (chain 97) and mainnet (chain 56).

| Contract | Scripts |
|---|---|
| token | `preflight:token:{testnet,mainnet}`, `deploy:token:{testnet,mainnet}`, `verify:token:{testnet,mainnet}` |
| staking | `preflight:staking:*`, `deploy:staking:*`, `verify:staking:*` |
| vesting | `preflight:vesting:*`, `deploy:vesting:{testnet,mainnet}`, `fund:vesting:mainnet`, `inspect:vesting:*`, `verify:vesting:*`, `rehearse:vesting:testnet`, `release:vesting:testnet` |
| treasury | `preflight:treasury:*`, `deploy:treasury:mainnet`, `verify:treasury:*`, `rehearse:treasury:testnet` |

The mainnet contracts above are already deployed. The mainnet deploy scripts refuse to deploy a second copy unless `ALLOW_REDEPLOY=true`. Verification of the vesting contract needs `MAINNET_VESTING_ADDRESS` and `MAINNET_START_TIMESTAMP=1786872990`.

## Configuration

Copy `.env.example` to `.env` and fill in your own values. No private key, seed phrase, API secret or `.env` file is included in this repository.

## Disclaimer

This repository documents deployed, source-verified smart contracts. It is not financial advice, an audit report, or an offer to sell securities. See [`docs/RISK_DISCLOSURES.md`](docs/RISK_DISCLOSURES.md).

## License

MIT, see [LICENSE](LICENSE).
