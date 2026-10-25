// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice Testnet-only token used for the MeridianVesting rehearsal.
 *         Do not deploy this contract on BSC Mainnet.
 */
contract RehearsalToken is ERC20 {
    constructor(address recipient) ERC20("Meridian Vesting Rehearsal", "MRDN-TEST") {
        _mint(recipient, 1_000_000_000 ether);
    }
}