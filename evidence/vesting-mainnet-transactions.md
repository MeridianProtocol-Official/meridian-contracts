# Mainnet Transaction Evidence

## Deployment

- Hash: `0xbd2f449028a8360afc8e9318b7e9fb5d650c4822ae86988b87c6e7dab686cf45`
- Receipt: status `1`, block `116249501`
- Link: https://bscscan.com/tx/0xbd2f449028a8360afc8e9318b7e9fb5d650c4822ae86988b87c6e7dab686cf45

## Funding

- Hash: `0x38666dfedef6f32c745eef55d26d9b889306f23b9ca7d7dcda45cbbdbde20e4e`
- Amount: `180,000,000 MRDN`
- Receipt: status `1`, block `116403168`
- Link: https://bscscan.com/tx/0x38666dfedef6f32c745eef55d26d9b889306f23b9ca7d7dcda45cbbdbde20e4e

## Post-funding proof

Direct BSC Mainnet readback confirms:

- MRDN balance of vesting contract: exactly `180,000,000 MRDN`
- `totalAllocation()`: `180,000,000 MRDN`
- `totalReleased()`: `0`
- `vestedAmount()`: `0`
- `releasable()`: `0`

The full readback is in `vesting-mainnet-readback.json`.
