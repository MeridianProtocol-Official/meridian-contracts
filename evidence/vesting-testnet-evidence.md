# BSC Testnet Rehearsal Evidence

The original rehearsal used a temporary token and scaled timing. It was not
the mainnet MRDN token and must not be treated as the production allocation.

## Verified rehearsal contracts

- Temporary rehearsal token (`MRDN-TEST`):
  `0x0CCCc27BE59b464b7a2B3fb941f09823938263E7`
  - [Verified source](https://testnet.bscscan.com/address/0x0CCCc27BE59b464b7a2B3fb941f09823938263E7#code)
- Testnet vesting contract:
  `0x2abA32fa6517E5E56C9fa375Ae2284A38a3e8887`
  - [Verified source](https://testnet.bscscan.com/address/0x2abA32fa6517E5E56C9fa375Ae2284A38a3e8887#code)
- Testnet schedule: 60-second cliff, 300-second total duration
- Test allocation: 1,000,000 MRDN-TEST

## Deployment and funding

- Vesting deployment:
  `0xebbd5acf9c22c4097400233fbe27eb80e99e833c4ad483cb8d75753035f097e1`
  - [BscScan](https://testnet.bscscan.com/tx/0xebbd5acf9c22c4097400233fbe27eb80e99e833c4ad483cb8d75753035f097e1)
- Test-token funding:
  `0x12addc856c68622340a5a0ca23030b6963fe4930d8d3bddc76b44b5d353f1409`
  - [BscScan](https://testnet.bscscan.com/tx/0x12addc856c68622340a5a0ca23030b6963fe4930d8d3bddc76b44b5d353f1409)

## Successful post-cliff release transactions

- First post-cliff release:
  `0xe81aea49ce54a7a1da62fe57c59bebbbf4cc47895e14c3e71ce6a81219bbc247`
  - [BscScan](https://testnet.bscscan.com/tx/0xe81aea49ce54a7a1da62fe57c59bebbbf4cc47895e14c3e71ce6a81219bbc247)
  - Receipt status `1`, block `125391775`
- Additional successful releases:
  - [`0x2cf9bb8a51f8856b85297eee7b24a1d9b6d538ebb615cbb4f03f7bde76d2449f`](https://testnet.bscscan.com/tx/0x2cf9bb8a51f8856b85297eee7b24a1d9b6d538ebb615cbb4f03f7bde76d2449f)
  - [`0x79c5f945b062a093ea56dece030f6dcdd0884a5f824a2f4395a406969c70f0fe`](https://testnet.bscscan.com/tx/0x79c5f945b062a093ea56dece030f6dcdd0884a5f824a2f4395a406969c70f0fe)

## Cliff-revert evidence clarification

The original rehearsal's pre-cliff test was performed as a local revert
assertion/static behavior check, not as a mined BSC Testnet transaction. The
chain therefore has **no honest pre-cliff reverted transaction hash** for that
original contract. The local test suite records the expected
`nothing to release` revert.

An additional dedicated testnet-only rehearsal was attempted while preparing
this handover to create a mined revert hash, but it was not broadcast because
the testnet deployer had insufficient BNB for deployment gas. No fake hash is
included. This limitation does not affect the completed Mainnet deployment or
funding.

## Testnet behavior result

- No release before the cliff: verified by local tests and the rehearsal
  behavior check.
- Release destination: fixed beneficiary only.
- Final beneficiary balance: exactly 1,000,000 MRDN-TEST.
- Final `releasable()`: zero.