// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MeridianVesting
 * @notice A fully trustless, immutable vesting schedule for a fixed amount of
 *         MRDN tokens sent to this contract. Tokens unlock linearly after a
 *         cliff period and can be released to a single, fixed beneficiary.
 * @dev Deliberately has ZERO admin surface — this is stronger than a typical
 *      "owner-controlled" vesting wallet:
 *
 * - There is no owner, no admin, no pause, and no way for anyone —
 *   including whoever deploys this contract — to change the beneficiary,
 *   the schedule, or to withdraw tokens early or to any other address.
 * - `release()` is permissionless: ANYONE may call it at ANY time, but it
 *   can only ever send newly-vested tokens to the single, immutable
 *   `beneficiary` address set at deployment.
 * - The contract holds no logic that can be upgraded, paused, or bypassed.
 *
 * This contract has NOT been independently audited. Treat it as pending
 * independent review before relying on it for real value.
 */

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MeridianVesting {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint64 public immutable startTimestamp;
    uint64 public immutable cliffDuration;
    uint64 public immutable totalDuration;
    uint256 public totalReleased;

    event Released(uint256 amount, uint256 totalReleasedSoFar);

    constructor(
        address token_,
        address beneficiary_,
        uint64 startTimestamp_,
        uint64 cliffDuration_,
        uint64 totalDuration_
    ) {
        require(token_ != address(0), "token is zero address");
        require(beneficiary_ != address(0), "beneficiary is zero address");
        require(totalDuration_ >= cliffDuration_, "total duration < cliff");
        require(totalDuration_ > 0, "total duration is zero");

        token = IERC20(token_);
        beneficiary = beneficiary_;
        startTimestamp = startTimestamp_;
        cliffDuration = cliffDuration_;
        totalDuration = totalDuration_;
    }

    function totalAllocation() public view returns (uint256) {
        return token.balanceOf(address(this)) + totalReleased;
    }

    function vestedAmount() public view returns (uint256) {
        uint256 allocation = totalAllocation();
        if (allocation == 0) return 0;

        uint256 cliffEnd = uint256(startTimestamp) + uint256(cliffDuration);
        if (block.timestamp < cliffEnd) return 0;

        uint256 vestEnd = uint256(startTimestamp) + uint256(totalDuration);
        if (block.timestamp >= vestEnd) return allocation;

        uint256 elapsed = block.timestamp - uint256(startTimestamp);
        return (allocation * elapsed) / uint256(totalDuration);
    }

    function releasable() public view returns (uint256) {
        uint256 vested = vestedAmount();
        if (vested <= totalReleased) return 0;
        return vested - totalReleased;
    }

    function release() external {
        uint256 amount = releasable();
        require(amount > 0, "nothing to release");
        totalReleased += amount;
        token.safeTransfer(beneficiary, amount);
        emit Released(amount, totalReleased);
    }
}