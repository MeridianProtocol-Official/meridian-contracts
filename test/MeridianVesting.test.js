const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MeridianVesting", function () {
  const ONE_DAY = 24 * 60 * 60;
  const CLIFF = 180 * ONE_DAY;
  const TOTAL = 730 * ONE_DAY;

  async function deployFixture() {
    const [deployer, beneficiary, stranger] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("RehearsalToken");
    const token = await Token.deploy(deployer.address);
    await token.waitForDeployment();

    const start = (await time.latest()) + 10;
    const Vesting = await ethers.getContractFactory("MeridianVesting");
    const vesting = await Vesting.deploy(
      await token.getAddress(),
      beneficiary.address,
      start,
      CLIFF,
      TOTAL
    );
    await vesting.waitForDeployment();

    const allocation = ethers.parseUnits("100000000", 18);
    await token.transfer(await vesting.getAddress(), allocation);
    return { token, vesting, deployer, beneficiary, stranger, start, allocation };
  }

  it("has no releasable tokens before the cliff", async function () {
    const { vesting } = await deployFixture();
    expect(await vesting.releasable()).to.equal(0n);
    let error;
    try {
      await vesting.release();
    } catch (caught) {
      error = caught;
    }
    expect(error).to.not.equal(undefined);
    expect(String(error)).to.include("nothing to release");
  });

  it("accrues from start but gates release until the cliff", async function () {
    const { vesting, allocation, start } = await deployFixture();
    await time.increaseTo(start + CLIFF + 1);
    const expectedMinimum = (allocation * BigInt(CLIFF)) / BigInt(TOTAL);
    expect(await vesting.releasable()).to.be.greaterThanOrEqual(expectedMinimum);
  });

  it("releases the full allocation after the total duration", async function () {
    const { vesting, token, beneficiary, allocation } = await deployFixture();
    await time.increase(TOTAL + ONE_DAY);
    await vesting.release();
    expect(await token.balanceOf(beneficiary.address)).to.equal(allocation);
    expect(await vesting.totalReleased()).to.equal(allocation);
  });

  it("lets an unrelated caller release only to the fixed beneficiary", async function () {
    const { vesting, token, beneficiary, stranger } = await deployFixture();
    await time.increase(TOTAL + ONE_DAY);
    const beneficiaryBefore = await token.balanceOf(beneficiary.address);
    const strangerBefore = await token.balanceOf(stranger.address);
    await vesting.connect(stranger).release();
    expect(await token.balanceOf(beneficiary.address)).to.be.greaterThan(beneficiaryBefore);
    expect(await token.balanceOf(stranger.address)).to.equal(strangerBefore);
  });

  it("has no owner, pause, redirect, or rescue surface", async function () {
    const { vesting } = await deployFixture();
    const names = vesting.interface.fragments
      .filter((fragment) => fragment.type === "function")
      .map((fragment) => fragment.name);
    expect(names).to.not.include.members([
      "owner",
      "setBeneficiary",
      "changeBeneficiary",
      "withdraw",
      "emergencyWithdraw",
      "rescueTokens",
      "pause",
      "transferOwnership"
    ]);
  });

  it("rejects a total duration shorter than the cliff", async function () {
    const [deployer, beneficiary] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("RehearsalToken");
    const token = await Token.deploy(deployer.address);
    await token.waitForDeployment();
    const Vesting = await ethers.getContractFactory("MeridianVesting");
    let error;
    try {
      const vesting = await Vesting.deploy(
        await token.getAddress(),
        beneficiary.address,
        1,
        TOTAL,
        CLIFF
      );
      await vesting.waitForDeployment();
    } catch (caught) {
      error = caught;
    }
    expect(error).to.not.equal(undefined);
    expect(String(error)).to.include("total duration < cliff");
  });

  it("includes tokens added after deployment in the allocation", async function () {
    const { vesting, token, beneficiary } = await deployFixture();
    await token.transfer(await vesting.getAddress(), ethers.parseUnits("50000000", 18));
    await time.increase(TOTAL + ONE_DAY);
    await vesting.release();
    expect(await token.balanceOf(beneficiary.address)).to.equal(
      ethers.parseUnits("150000000", 18)
    );
  });
});