const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MeridianTreasuryTimelock", function () {
  const MIN_DELAY = 3 * 24 * 60 * 60; // 72 hours

  async function deployFixture() {
    const [deployer, owner, recipient, stranger] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("LaunchToken");
    const token = await Token.deploy("Meridian Protocol", "MRDN", "1000000000", 18, deployer.address);
    await token.waitForDeployment();

    const Treasury = await ethers.getContractFactory("MeridianTreasuryTimelock");
    const treasury = await Treasury.deploy(await token.getAddress(), owner.address, MIN_DELAY);
    await treasury.waitForDeployment();

    const funding = ethers.parseUnits("150000000", 18);
    await token.transfer(await treasury.getAddress(), funding);

    return { token, treasury, deployer, owner, recipient, stranger, funding };
  }

  it("holds the funded treasury balance correctly", async function () {
    const { treasury, funding } = await deployFixture();
    expect(await treasury.treasuryBalance()).to.equal(funding);
  });

  it("rejects instant withdrawal — no such function exists", async function () {
    const { treasury } = await deployFixture();
    const names = treasury.interface.fragments
      .filter((f) => f.type === "function")
      .map((f) => f.name);
    expect(names).to.not.include.members(["withdraw", "transfer", "instantWithdraw", "emergencyWithdraw"]);
  });

  it("requires an announcement before any withdrawal can execute", async function () {
    const { treasury, owner } = await deployFixture();
    await expect(treasury.connect(owner).executeWithdrawal()).to.be.revertedWith("no pending withdrawal");
  });

  it("reverts execution before the delay has elapsed", async function () {
    const { treasury, owner, recipient } = await deployFixture();
    const amount = ethers.parseUnits("1000000", 18);

    await treasury.connect(owner).announceWithdrawal(recipient.address, amount);
    await time.increase(MIN_DELAY - 60 * 60); // 1 hour short

    await expect(treasury.connect(owner).executeWithdrawal()).to.be.revertedWith("delay has not elapsed yet");
  });

  it("executes successfully once the full delay has elapsed", async function () {
    const { token, treasury, owner, recipient } = await deployFixture();
    const amount = ethers.parseUnits("1000000", 18);

    await treasury.connect(owner).announceWithdrawal(recipient.address, amount);
    await time.increase(MIN_DELAY + 1);

    await expect(treasury.connect(owner).executeWithdrawal())
      .to.emit(treasury, "WithdrawalExecuted")
      .withArgs(recipient.address, amount);

    expect(await token.balanceOf(recipient.address)).to.equal(amount);
  });

  it("emits a public announcement event with the exact executable timestamp", async function () {
    const { treasury, owner, recipient } = await deployFixture();
    const amount = ethers.parseUnits("500000", 18);

    const tx = await treasury.connect(owner).announceWithdrawal(recipient.address, amount);
    const receipt = await tx.wait();
    const block = await ethers.provider.getBlock(receipt.blockNumber);
    const expectedExecutableAfter = block.timestamp + MIN_DELAY;

    await expect(tx)
      .to.emit(treasury, "WithdrawalAnnounced")
      .withArgs(recipient.address, amount, expectedExecutableAfter);
  });

  it("lets the owner cancel a pending withdrawal before execution", async function () {
    const { treasury, owner, recipient } = await deployFixture();
    const amount = ethers.parseUnits("1000000", 18);

    await treasury.connect(owner).announceWithdrawal(recipient.address, amount);
    await expect(treasury.connect(owner).cancelWithdrawal())
      .to.emit(treasury, "WithdrawalCancelled")
      .withArgs(recipient.address, amount);

    await time.increase(MIN_DELAY + 1);
    await expect(treasury.connect(owner).executeWithdrawal()).to.be.revertedWith("no pending withdrawal");
  });

  it("disables renouncing ownership so treasury funds cannot be permanently locked", async function () {
    const { treasury, owner } = await deployFixture();

    await expect(treasury.connect(owner).renounceOwnership()).to.be.revertedWith(
      "renounceOwnership disabled: would permanently lock treasury funds",
    );
    expect(await treasury.owner()).to.equal(owner.address);
  });

  it("allows the owner to transfer ownership", async function () {
    const { treasury, owner, stranger } = await deployFixture();

    await expect(treasury.connect(owner).transferOwnership(stranger.address))
      .to.emit(treasury, "OwnershipTransferred")
      .withArgs(owner.address, stranger.address);

    expect(await treasury.owner()).to.equal(stranger.address);
  });

  it("prevents a non-owner from announcing, cancelling, or executing", async function () {
    const { treasury, stranger, recipient } = await deployFixture();
    const amount = ethers.parseUnits("1000", 18);

    await expect(
      treasury.connect(stranger).announceWithdrawal(recipient.address, amount),
    ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");

    await expect(
      treasury.connect(stranger).cancelWithdrawal(),
    ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");

    await expect(
      treasury.connect(stranger).executeWithdrawal(),
    ).to.be.revertedWithCustomError(treasury, "OwnableUnauthorizedAccount");
  });

  it("rejects announcing an amount larger than the treasury balance", async function () {
    const { treasury, owner, recipient, funding } = await deployFixture();
    await expect(
      treasury.connect(owner).announceWithdrawal(recipient.address, funding + 1n),
    ).to.be.revertedWith("amount exceeds treasury balance");
  });

  it("correctly reports timeUntilExecutable before and after the delay", async function () {
    const { treasury, owner, recipient } = await deployFixture();
    const amount = ethers.parseUnits("1000", 18);

    await treasury.connect(owner).announceWithdrawal(recipient.address, amount);
    const remaining = await treasury.timeUntilExecutable();
    expect(remaining).to.be.closeTo(BigInt(MIN_DELAY), 5n);

    await time.increase(MIN_DELAY + 1);
    expect(await treasury.timeUntilExecutable()).to.equal(0);
  });

  it("rejects deployment with a delay shorter than 1 day", async function () {
    const [deployer, owner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("LaunchToken");
    const token = await Token.deploy("Meridian Protocol", "MRDN", "1000000000", 18, deployer.address);
    await token.waitForDeployment();

    const Treasury = await ethers.getContractFactory("MeridianTreasuryTimelock");
    await expect(
      Treasury.deploy(await token.getAddress(), owner.address, 60 * 60), // 1 hour
    ).to.be.revertedWith("delay too short to be meaningful");
  });
});