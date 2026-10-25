// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LaunchToken
 * @notice Minimal fixed-supply ERC-20 starter for a BNB Smart Chain launch.
 * @dev The contract has no owner and no post-deployment admin surface.
 *
 * This template intentionally does not include:
 * - transfer taxes or fee-on-transfer logic
 * - blacklist or whitelist controls
 * - hidden minting
 * - upgradeable proxy logic
 * - anti-bot or anti-whale bypass paths
 *
 * Install OpenZeppelin Contracts 5.x before compiling. The exact package
 * version, compiler version, optimizer settings, and constructor argument must
 * be recorded in the deployment evidence folder.
 */
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LaunchToken is ERC20 {
    uint8 private immutable _tokenDecimals;

    /**
     * @param name_ Human-readable token name.
     * @param symbol_ Short token symbol.
     * @param initialSupply_ Whole-token supply before decimals are applied.
     * @param decimals_ Display decimals. Record and freeze this value.
     * @param initialHolder_ Wallet receiving the entire fixed supply. This
     *        address cannot mint, burn, pause, or change the contract.
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        uint8 decimals_,
        address initialHolder_
    ) ERC20(name_, symbol_) {
        require(initialHolder_ != address(0), "initial holder is zero");
        require(initialSupply_ > 0, "supply is zero");
        require(decimals_ <= 18, "decimals above 18");

        _tokenDecimals = decimals_;
        _mint(initialHolder_, initialSupply_ * (10 ** uint256(decimals_)));
    }

    function decimals() public view override returns (uint8) {
        return _tokenDecimals;
    }
}