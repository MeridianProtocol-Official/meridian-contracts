// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MeridianStaking
 * @notice Flexible staking pool for a single ERC-20 token (MRDN). Stakers
 *         deposit tokens and continuously accrue rewards, paid from a
 *         separately funded reward pool, for as long as they remain staked.
 *         Stakers may unstake their full principal at any time.
 * @dev Design goals, matching LaunchToken.sol's minimal-admin philosophy:
 *
 * - The owner can NEVER withdraw, freeze, or move a staker's principal.
 *   `stake()` and `unstake()` are only callable by the staker themself on
 *   their own balance.
 * - The owner's only powers are: (1) set the reward rate going forward,
 *   and (2) top up the reward pool by depositing more reward tokens. There
 *   is no owner function that pulls tokens OUT of the contract to the
 *   owner's own wallet.
 * - No blacklist, no pause, no upgradeability, no hidden mint (this
 *   contract does not mint tokens at all — rewards are paid only from
 *   tokens the owner has deposited into the pool in advance).
 * - Reward accounting uses the standard accumulated-reward-per-token
 *   pattern (as used by widely reviewed staking contracts such as
 *   Synthetix StakingRewards), which avoids unbounded loops over stakers.
 *
 * This contract has NOT been independently audited. See the project's
 * SECURITY_REVIEW.md before any mainnet deployment or public use.
 */

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MeridianStaking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    /// @notice The token that is staked AND the token rewards are paid in.
    IERC20 public immutable stakingToken;

    /// @notice Reward tokens distributed per second, across all stakers combined.
    uint256 public rewardRatePerSecond;

    /// @notice Total tokens currently staked by all users.
    uint256 public totalStaked;

    /// @notice Reward pool balance still available to pay out (owner-funded).
    uint256 public rewardPoolBalance;

    uint256 private _rewardPerTokenStored;
    uint256 private _lastUpdateTime;

    mapping(address => uint256) public stakedBalanceOf;
    mapping(address => uint256) private _userRewardPerTokenPaid;
    mapping(address => uint256) private _rewards;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRatePerSecond);
    event RewardPoolFunded(address indexed funder, uint256 amount);

    /**
     * @param stakingToken_ The MRDN token contract address. Used both as the
     *        staked asset and the reward asset.
     * @param initialOwner_ Address that may adjust the reward rate and fund
     *        the reward pool. Cannot withdraw staker principal.
     */
    constructor(address stakingToken_, address initialOwner_) Ownable(initialOwner_) {
        require(stakingToken_ != address(0), "staking token is zero");
        stakingToken = IERC20(stakingToken_);
        _lastUpdateTime = block.timestamp;
    }

    modifier updateReward(address account) {
        _rewardPerTokenStored = rewardPerToken();
        _lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            _rewards[account] = earned(account);
            _userRewardPerTokenPaid[account] = _rewardPerTokenStored;
        }
        _;
    }

    /// @notice Accumulated reward per staked token, scaled by 1e18.
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return _rewardPerTokenStored;
        }
        uint256 elapsed = block.timestamp - _lastUpdateTime;
        return _rewardPerTokenStored + (elapsed * rewardRatePerSecond * 1e18) / totalStaked;
    }

    /// @notice Reward tokens earned by `account` but not yet claimed.
    function earned(address account) public view returns (uint256) {
        uint256 delta = rewardPerToken() - _userRewardPerTokenPaid[account];
        return (stakedBalanceOf[account] * delta) / 1e18 + _rewards[account];
    }

    /**
     * @notice Deposit `amount` of the staking token to start (or add to)
     *         your stake. Requires prior ERC-20 `approve`.
     */
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "amount is zero");
        totalStaked += amount;
        stakedBalanceOf[msg.sender] += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Withdraw `amount` of your own staked principal. Does not
     *         claim rewards automatically — call `claimReward()` separately
     *         or use `exit()` to do both in one transaction.
     */
    function unstake(uint256 amount) public nonReentrant updateReward(msg.sender) {
        require(amount > 0, "amount is zero");
        require(stakedBalanceOf[msg.sender] >= amount, "amount exceeds stake");
        totalStaked -= amount;
        stakedBalanceOf[msg.sender] -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    /// @notice Claim all currently earned, unclaimed rewards.
    function claimReward() public nonReentrant updateReward(msg.sender) {
        uint256 reward = _rewards[msg.sender];
        require(reward > 0, "no reward due");
        require(reward <= rewardPoolBalance, "reward pool underfunded");
        _rewards[msg.sender] = 0;
        rewardPoolBalance -= reward;
        stakingToken.safeTransfer(msg.sender, reward);
        emit RewardPaid(msg.sender, reward);
    }

    /// @notice Unstake your full balance and claim all rewards in one call.
    function exit() external {
        unstake(stakedBalanceOf[msg.sender]);
        claimReward();
    }

    /**
     * @notice Owner-only: add tokens to the reward pool. Anyone funding
     *         this pool is choosing to give those tokens to stakers over
     *         time — this function never removes tokens from the contract.
     */
    function fundRewardPool(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "amount is zero");
        rewardPoolBalance += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardPoolFunded(msg.sender, amount);
    }

    /**
     * @notice Owner-only: set the reward emission rate going forward. Does
     *         not affect rewards already accrued.
     */
    function setRewardRate(uint256 newRatePerSecond) external onlyOwner updateReward(address(0)) {
        rewardRatePerSecond = newRatePerSecond;
        emit RewardRateUpdated(newRatePerSecond);
    }
}
