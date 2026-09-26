# Meridian Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity: ^0.8.24](https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity)](https://github.com/ethereum/solidity)
[![BNB Smart Chain](https://img.shields.io/badge/Blockchain-BSC-F7931A?logo=binance)](https://www.bscscan.com/)

Official smart-contract source code and technical documentation for **Meridian Protocol (MRDN)**, a fixed-supply BEP-20 token on BNB Smart Chain with integrated staking, vesting, and treasury timelock mechanisms.

This repository is published for **public transparency, developer reference, security audit scoping, and third-party review**.

## Overview

| Component | Status | Network | Address |
|---|---|---|---|
| **MRDN Token** | ✅ LIVE | BSC Mainnet | [`0xd4025a390a0b2a606f24Ea33A902D10D978715F2`](https://bscscan.com/address/0xd4025a390a0b2a606f24Ea33A902D10D978715F2) |
| **MeridianStaking** | ✅ LIVE | BSC Mainnet | [`0xE4679e407A4967f7182E87C1bc25Dcc786c3D3eb`](https://bscscan.com/address/0xE4679e407A4967f7182E87C1bc25Dcc786c3D3eb) |
| **MeridianVesting** | ✅ LIVE | BSC Mainnet | [`0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7`](https://bscscan.com/address/0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7) |
| **Treasury Timelock** | ✅ LIVE | BSC Mainnet | [`0x921B238633241e14606217b9bFa2e2dE0Db67033`](https://bscscan.com/address/0x921B238633241e14606217b9bFa2e2dE0Db67033) |

## Token Specifications

```
Name:           Meridian Protocol
Symbol:         MRDN
Standard:       BEP-20 (ERC-20)
Decimals:       18
Total Supply:   1,000,000,000 MRDN (fixed, non-inflationary)
Blockchain:     BNB Smart Chain (Chain ID: 56)
```

## Project Structure

```
meridian-contracts/
├── contracts/
│   ├── token/
│   │   └── LaunchToken.sol           # Fixed-supply BEP-20 token
│   ├── staking/
│   │   └── MeridianStaking.sol       # Flexible staking pool
│   ├── vesting/
│   │   └── MeridianVesting.sol       # Beneficiary vesting schedule
│   └── treasury/
│       └── MeridianTreasuryTimelock.sol  # Timelock-gated treasury
├── test/
│   ├── LaunchToken.test.js           # Token tests
│   ├── MeridianStaking.test.js       # Staking tests
│   ├── MeridianVesting.test.js       # Vesting tests
│   └── MeridianTreasuryTimelock.test.js  # Treasury tests
├── scripts/
│   ├── deploy.cjs                    # MRDN token deployment
│   ├── deploy-vesting-mainnet.js     # Vesting deployment
│   ├── deploy-treasury-mainnet.cjs   # Treasury deployment
│   ├── verify.cjs                    # Token verification
│   ├── verify-vesting-mainnet.js     # Vesting verification
│   ├── verify-treasury-mainnet.cjs   # Treasury verification
│   └── preflight.cjs                 # Pre-deployment checks
├── docs/
│   ├── README.md                     # Documentation index
│   ├── architecture.md               # System architecture
│   ├── contracts.md                  # Contract documentation
│   ├── deployments.md                # Deployment parameters
│   ├── security.md                   # Security considerations
│   ├── testing.md                    # Test documentation
│   ├── audit-scope.md                # Audit scope definition
│   ├── audit-freeze.md               # Audit version control
│   └── official-links.md             # Official channels
├── evidence/
│   └── build/                        # Compiled artifacts
├── .gitignore
├── hardhat.config.cjs                # Hardhat configuration
├── package.json
├── SECURITY.md                       # Vulnerability reporting
├── CONTRIBUTING.md                   # Contribution guidelines
├── CHANGELOG.md                      # Release history
├── AUDIT_READINESS.md               # Audit readiness status
└── LICENSE                           # MIT License
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Git

### Installation

```bash
git clone https://github.com/MeridianProtocol-Official/meridian-contracts.git
cd meridian-contracts
npm install
```

### Compilation

```bash
npm run compile
```

### Testing

```bash
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

### Deployment (Testnet)

Set your `.env` file:

```bash
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s0.binance.org:8545
BSCSCAN_API_KEY=your_bscscan_api_key
DEPLOYER_PRIVATE_KEY=your_private_key_without_0x
INITIAL_HOLDER=0x...
```

Then:

```bash
npm run preflight:testnet
npm run deploy:testnet
npm run verify:testnet
```

### Deployment (Mainnet)

```bash
BSC_MAINNET_RPC_URL=https://bsc-dataseed.binance.org
BSCSCAN_API_KEY=your_bscscan_api_key
DEPLOYER_PRIVATE_KEY=your_private_key_without_0x
INITIAL_HOLDER=0x...
```

Then:

```bash
npm run deploy:mainnet
npm run verify:mainnet
```

## Smart Contracts

### 1. LaunchToken (MRDN)

Fixed-supply BEP-20 token with **zero administrative functions**.

**Key Features:**
- No mint, burn, pause, or blacklist functionality
- Fixed total supply (1 billion MRDN)
- Immutable after deployment
- Built on OpenZeppelin ERC20

**Address:** [`0xd4025a390a0b2a606f24Ea33A902D10D978715F2`](https://bscscan.com/address/0xd4025a390a0b2a606f24Ea33A902D10D978715F2)

### 2. MeridianStaking

Flexible staking pool allowing MRDN holders to earn continuous rewards.

**Key Features:**
- Deposit and withdraw at any time (no lockup)
- Continuous reward accrual
- Owner-funded reward pool
- Reentrancy guard protection
- Accumulated reward per token pattern

**Address:** [`0xE4679e407A4967f7182E87C1bc25Dcc786c3D3eb`](https://bscscan.com/address/0xE4679e407A4967f7182E87C1bc25Dcc786c3D3eb)

### 3. MeridianVesting

Trustless, immutable vesting schedule for founder/team allocation.

**Key Features:**
- Fixed 300-day cliff period
- 1,095-day (3-year) linear vesting after cliff
- Zero admin functions—immutable after deployment
- Permissionless release (anyone can trigger)
- Single, immutable beneficiary

**Address:** [`0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7`](https://bscscan.com/address/0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7)

### 4. MeridianTreasuryTimelock

72-hour public-notice withdrawal mechanism for treasury funds.

**Key Features:**
- Mandatory 72-hour (259,200 seconds) delay between announcement and execution
- Public on-chain event for every withdrawal
- Single-key controlled (currently not a multisig)
- Prevents accidental fund loss via notice period
- Ownership transfer supported; renounce disabled

**Address:** [`0x921B238633241e14606217b9bFa2e2dE0Db67033`](https://bscscan.com/address/0x921B238633241e14606217b9bFa2e2dE0Db67033)

## Build Environment

| Tool | Version |
|---|---|
| **Solidity** | 0.8.24 |
| **Hardhat** | 2.29.0 |
| **@nomicfoundation/hardhat-toolbox** | 5.0.0 |
| **OpenZeppelin Contracts** | 5.6.1 |
| **ethers.js** | ^6.17.0 |
| **Node.js** | 18+ |

## Documentation

Comprehensive technical documentation is available in the `docs/` directory:

- **[architecture.md](docs/architecture.md)** — System design and component relationships
- **[contracts.md](docs/contracts.md)** — Detailed contract documentation
- **[deployments.md](docs/deployments.md)** — Deployment parameters and addresses
- **[security.md](docs/security.md)** — Security considerations and audit status
- **[testing.md](docs/testing.md)** — Test suite documentation
- **[audit-scope.md](docs/audit-scope.md)** — Third-party audit scope
- **[official-links.md](docs/official-links.md)** — Official channels and resources

## Security

### Current Status

✅ **Source Code Verified** on BscScan for all four contracts  
⏳ **Independent Manual Audit** — Commissioned and planned  
⚠️ **Automated Analysis** (SolidityScan) — Results available in `docs/security.md`

**Automated scanning is NOT a substitute for independent manual audit.**

### Responsible Disclosure

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. **DO NOT** share private keys, seed phrases, or API keys
3. Email: **admin@meridianprotocol.site**

See [SECURITY.md](SECURITY.md) for full responsible-disclosure process.

## Testing

All contracts include comprehensive test suites:

| Contract | Tests | Status |
|---|---|---|
| LaunchToken | 7 | ✅ |
| MeridianStaking | 11 | ✅ |
| MeridianVesting | 7 | ✅ |
| MeridianTreasuryTimelock | 18 | ✅ |
| **Total** | **43** | ✅ |

Run all tests:

```bash
npm test
```

## Compliance & Standards

- **BEP-20** — Compatible with BNB Smart Chain standards
- **ERC-20** — Fully compatible with Ethereum standards
- **OpenZeppelin** — Built on audited, battle-tested libraries
- **Solidity 0.8.24** — Latest stable compiler with safety features
- **MIT License** — Permissive open-source license

## Community & Support

| Channel | Link |
|---|---|
| **Website** | https://meridianprotocol.site/ |
| **GitHub** | https://github.com/MeridianProtocol-Official |
| **Email** | admin@meridianprotocol.site |
| **X/Twitter** | https://x.com/Meridian_MRDN |
| **Telegram** | https://t.me/MeridianProtocol |
| **Discord** | https://discord.gg/ymBr23ppCq |

## Contributing

Meridian Protocol is currently developed and maintained by the core team. External contributions are not yet accepted, but feedback, issues, and suggestions are welcome.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Disclaimer

This repository is provided for **transparency and technical review only**. It does not constitute financial, investment, legal, or tax advice. Smart-contract interaction carries technical risk, including the possibility of undiscovered defects. See [SECURITY.md](SECURITY.md) and `docs/security.md` for full risk disclosure.

## License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

**Repository:** https://github.com/MeridianProtocol-Official/meridian-contracts  
**Status:** ✅ Open Source | Public Transparency | Audit-Ready
