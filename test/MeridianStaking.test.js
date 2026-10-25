const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MeridianStaking", function () {
  async function deployFixture() {
    const [deployer, owner, alice, bob] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("LaunchToken");
    const token = await Token.deploy(
      "Meridian Protocol",
      "MRDN",
      "1000000000",
      18,
      deployer.address,
    );
    await token.waitForDeployment();

    const Staking = await ethers.getContractFactory("MeridianStaking");
    const staking = await Staking.deploy(await token.getAddress(), owner.address);
    await staking.waitForDeployment();

    // Give alice and bob some tokens to stake, and fund the reward pool.
    const amount = ethers.parseUnits("1000", 18);
    await token.transfer(alice.address, amount);
    await token.transfer(bob.address, amount);

    const rewardFunding = ethers.parseUnits("10000", 18);
    await token.transfer(owner.address, rewardFunding);
    await token.connect(owner).approve(await staking.getAddress(), rewardFunding);
    await staking.connect(owner).fundRewardPool(rewardFunding);

    return { token, staking, deployer, owner, alice, bob };
  }

  it("accepts stakes and tracks totalStaked / stakedBalanceOf correctly", async function () {
    const { token, staking, alice } = await deployFixture();
    const stakeAmount = ethers.parseUnits("100", 18);

    await token.connect(alice).approve(await staking.getAddress(), stakeAmount);
    await expect(staking.connect(alice).stake(stakeAmount))
      .to.emit(staking, "Staked")
      .withArgs(alice.address, stakeAmount);

    expect(await staking.stakedBalanceOf(alice.address)).to.equal(stakeAmount);
    expect(await staking.totalStaked()).to.equal(stakeAmount);
  });

  it("accrues rewards over time proportional to the reward rate", async function () {
    const { token, staking, owner, alice } = await deployFixture();
    const stakeAmount = ethers.parseUnits("100", 18);
    const ratePerSecond = ethers.parseUnits("1", 18);

    await staking.connect(owner).setRewardRate(ratePerSecond);
    await token.connect(alice).approve(await staking.getAddress(), stakeAmount);
    await staking.connect(alice).stake(stakeAmount);

    await time.increase(100);

    const earned = await staking.earned(alice.address);
    // Sole staker: expected reward ~= ratePerSecond * elapsedSeconds.
    expect(earned).to.be.closeTo(ratePerSecond * 100n, ethers.parseUnits("1", 18));
  });

  it("lets a staker unstake their full principal at any time", async function () {
    const { token, staking, alice } = await deployFixture();
    const stakeAmount = ethers.parseUnits("100", 18);

    await token.connect(alice).approve(await staking.getAddress(), stakeAmount);
    await staking.connect(alice).stake(stakeAmount);

    const balanceBefore = await token.balanceOf(alice.address);
    await expect(staking.connect(alice).unstake(stakeAmount))
      .to.emit(staking, "Unstaked")
      .withArgs(alice.address, stakeAmount);

    expect(await token.balanceOf(alice.address)).to.equal(balanceBefore + stakeAmount);
    expect(await staking.stakedBalanceOf(alice.address)).to.equal(0);
  });

  it("pays out claimed rewards from the owner-funded pool only", async function () {
    const { token, staking, owner, alice } = await deployFixture();
    const stakeAmount = ethers.parseUnits("100", 18);

    await staking.connect(owner).setRewardRate(ethers.parseUnits("1", 18));
    await token.connect(alice).approve(await staking.getAddress(), stakeAmount);
    await staking.connect(alice).stake(stakeAmount);

    await time.increase(50);

    const balanceBefore = await token.balanceOf(alice.address);
    await staking.connect(alice).claimReward();
    const balanceAfter = await token.balanceOf(alice.address);

    expect(balanceAfter).to.be.greaterThan(balanceBefore);
  });

  it("rejects unstaking more than the caller's own staked balance", async function () {
    const { token, staking, alice } = await deployFixture();
    const stakeAmount = ethers.parseUnits("100", 18);

    await token.connect(alice).approve(await staking.getAddress(), stakeAmount);
    await staking.connect(alice).stake(stakeAmount);

    await expect(
      staking.connect(alice).unstake(stakeAmount + 1n),
    ).to.be.revertedWith("amount exceeds stake");
  });

  it("prevents a non-owner from changing the reward rate", async function () {
    const { staking, alice } = await deployFixture();
    await expect(
      staking.connect(alice).setRewardRate(ethers.parseUnits("1", 18)),
    ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
  });

  it("prevents a non-owner from funding the reward pool", async function () {
    const { token, staking, alice } = await deployFixture();
    const fundingAmount = ethers.parseUnits("100", 18);

    await token.connect(alice).approve(await staking.getAddress(), fundingAmount);
    await expect(
      staking.connect(alice).fundRewardPool(fundingAmount),
    ).to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount");
  });

  it("gives the owner no function that withdraws staker principal to themself", async function () {
    const { staking } = await deployFixture();
    const names = staking.interface.fragments
      .filter((fragment) => fragment.type === "function")
      .map((fragment) => fragment.name);
    // The owner can only fund the pool and set the rate — never sweep or
    // withdraw tokens out to their own wallet.
    expect(names).to.not.include.members(["withdrawAll", "sweep", "rescueTokens", "emergencyWithdraw"]);
  });

  it("exit() unstakes the full balance and claims rewards in one call", async function () {
    const { token, staking, owner, alice } = await deployFixture();
    const stakeAmount = ethers.parseUnits("100", 18);

    await staking.connect(owner).setRewardRate(ethers.parseUnits("1", 18));
    await token.connect(alice).approve(await staking.getAddress(), stakeAmount);
    await staking.connect(alice).stake(stakeAmount);
    await time.increase(20);

    await staking.connect(alice).exit();

    expect(await staking.stakedBalanceOf(alice.address)).to.equal(0);
    expect(await staking.earned(alice.address)).to.equal(0);
  });
});
