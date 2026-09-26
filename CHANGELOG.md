# Changelog

All notable changes to the Meridian Protocol smart contracts will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-09-26

### Added

- **Initial Release**
  - LaunchToken.sol — Fixed-supply BEP-20 MRDN token
  - MeridianStaking.sol — Flexible staking pool with reward accrual
  - MeridianVesting.sol — Trustless linear vesting schedule
  - MeridianTreasuryTimelock.sol — 72-hour timelock treasury management
  - Complete test suite (43 test cases across 4 contracts)
  - Hardhat deployment and verification scripts
  - Comprehensive technical documentation
  - Security and audit-readiness documentation

### Status

- ✅ All four contracts deployed and verified on BNB Smart Chain Mainnet
- ✅ Source code verified on BscScan
- ⏳ Independent manual audit — Planned

---

## Release Guidelines

Future releases will follow this format:

```markdown
## [VERSION] - YYYY-MM-DD

### Added
- New features or contracts

### Changed
- Changes in existing functionality

### Fixed
- Bug fixes

### Security
- Security patches and audit resolutions

### Deprecated
- Deprecated features or contracts

### Removed
- Removed features or contracts
```

---

**Current Version:** 0.1.0  
**Last Updated:** 2026-09-26
