// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MeridianTreasuryTimelock
 * @notice Holds the project's Treasury allocation of MRDN. The owner
 *         cannot withdraw funds instantly under any circumstance — every
 *         withdrawal must be publicly announced on-chain and then wait a
 *         fixed delay before it can execute.
 * @dev Honest framing: this is a SINGLE-KEY-controlled contract. It does
 *      NOT provide multi-party governance or decentralized trust. What it
 *      provides is advance public warning — anyone watching this contract
 *      (community, investors, this project's own documentation tooling)
 *      can see a withdrawal coming at least MIN_DELAY before it executes,
 *      and can react (ask questions publicly, etc.) before funds move.
 *
 * This contract has NOT been independently audited. See docs/ for the
 * same disclosure standard applied to every other contract in this
 * project.
 */

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MeridianTreasuryTimelock is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice The token held by this treasury (MRDN).
    IERC20 public immutable token;

    /// @notice Minimum delay, in seconds, between announcing and executing
    ///         a withdrawal. Fixed at deployment — cannot be shortened later.
    uint256 public immutable minDelay;

    struct PendingWithdrawal {
        address to;
        uint256 amount;
        uint256 executableAfter;
        bool exists;
    }

    /// @notice The single currently-pending withdrawal, if any. Only one
    ///         withdrawal can be pending at a time, to keep this
    ///         auditable and simple to watch.
    PendingWithdrawal public pending;

    event WithdrawalAnnounced(address indexed to, uint256 amount, uint256 executableAfter);
    event WithdrawalExecuted(address indexed to, uint256 amount);
    event WithdrawalCancelled(address indexed to, uint256 amount);

    /**
     * @param token_ MRDN token address.
     * @param initialOwner_ The single-key address controlling this
     *        treasury. Same disclosure as everywhere else in this
     *        project: this is not a multisig unless you deploy it behind
     *        one (e.g. set initialOwner_ to a Safe address).
     * @param minDelay_ Seconds a withdrawal must wait after being
     *        announced before it can execute. Cannot be changed later.
     */
    constructor(address token_, address initialOwner_, uint256 minDelay_) Ownable(initialOwner_) {
        require(token_ != address(0), "token is zero address");
        require(minDelay_ >= 1 days, "delay too short to be meaningful");
        token = IERC20(token_);
        minDelay = minDelay_;
    }

    /**
     * @notice Owner-only: publicly announce an intended withdrawal. Does
     *         NOT move any funds. Starts the mandatory public delay.
     *         Overwrites any previous pending withdrawal (only one at a
     *         time — announcing a new one cancels the old one implicitly;
     *         call cancelWithdrawal() first if you want that recorded
     *         as an explicit cancellation event instead).
     */
    function announceWithdrawal(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "recipient is zero address");
        require(amount > 0, "amount is zero");
        require(amount <= token.balanceOf(address(this)), "amount exceeds treasury balance");

        uint256 executableAfter = block.timestamp + minDelay;
        pending = PendingWithdrawal({to: to, amount: amount, executableAfter: executableAfter, exists: true});

        emit WithdrawalAnnounced(to, amount, executableAfter);
    }

    /**
     * @notice Owner-only: cancel the currently pending withdrawal before
     *         it executes. No funds ever moved, so this simply clears the
     *         pending state and emits a public record of the
     *         cancellation.
     */
    function cancelWithdrawal() external onlyOwner {
        require(pending.exists, "no pending withdrawal");
        address to = pending.to;
        uint256 amount = pending.amount;
        delete pending;
        emit WithdrawalCancelled(to, amount);
    }

    /**
     * @notice Owner-only: execute the pending withdrawal, ONLY after the
     *         announced delay has fully elapsed. Reverts if called too
     *         early or if nothing is pending.
     */
    function executeWithdrawal() external onlyOwner nonReentrant {
        require(pending.exists, "no pending withdrawal");
        require(block.timestamp >= pending.executableAfter, "delay has not elapsed yet");

        address to = pending.to;
        uint256 amount = pending.amount;
        delete pending;

        token.safeTransfer(to, amount);
        emit WithdrawalExecuted(to, amount);
    }

    /**
     * @notice Ownership may be transferred to a Safe or another explicitly
     *         approved controller, but it may never be renounced. Renouncing
     *         would permanently lock all treasury funds.
     */
    function renounceOwnership() public view override onlyOwner {
        revert("renounceOwnership disabled: would permanently lock treasury funds");
    }

    /// @notice Current treasury balance held by this contract.
    function treasuryBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice Seconds remaining until the pending withdrawal is
    ///         executable. Returns 0 if nothing is pending or the delay
    ///         has already elapsed.
    function timeUntilExecutable() external view returns (uint256) {
        if (!pending.exists || block.timestamp >= pending.executableAfter) {
            return 0;
        }
        return pending.executableAfter - block.timestamp;
    }
}