const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LaunchToken", function () {
  async function deployFixture() {
    const [deployer, holder, other] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("LaunchToken");
    const token = await Token.deploy(
      "Meridian Protocol",
      "MRDN",
      "1000000000",
      18,
      holder.address,
    );
    await token.waitForDeployment();
    return { token, deployer, holder, other };
  }

  it("mints the exact fixed supply to the initial holder", async function () {
    const { token, holder } = await deployFixture();
    expect(await token.name()).to.equal("Meridian Protocol");
    expect(await token.symbol()).to.equal("MRDN");
    expect(await token.decimals()).to.equal(18);
    expect(await token.totalSupply()).to.equal(ethers.parseUnits("1000000000", 18));
    expect(await token.balanceOf(holder.address)).to.equal(await token.totalSupply());
  });

  it("supports standard transfers and approvals", async function () {
    const { token, holder, other } = await deployFixture();
    await expect(token.connect(holder).transfer(other.address, 1000))
      .to.emit(token, "Transfer")
      .withArgs(holder.address, other.address, 1000);
    await token.connect(holder).approve(other.address, 500);
    await expect(token.connect(other).transferFrom(holder.address, other.address, 500))
      .to.emit(token, "Transfer")
      .withArgs(holder.address, other.address, 500);
  });

  it("rejects a zero initial holder and zero initial supply", async function () {
    const [deployer] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("LaunchToken");
    await expect(Token.deploy("Meridian Protocol", "MRDN", "100", 18, ethers.ZeroAddress))
      .to.be.revertedWith("initial holder is zero");
    await expect(Token.deploy("Meridian Protocol", "MRDN", "0", 18, deployer.address))
      .to.be.revertedWith("supply is zero");
  });

  it("rejects unsupported decimals above 18", async function () {
    const [deployer] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("LaunchToken");
    await expect(Token.deploy("Meridian Protocol", "MRDN", "100", 19, deployer.address))
      .to.be.revertedWith("decimals above 18");
  });

  it("has no mint, pause, blacklist, tax, or owner administration surface", async function () {
    const { token } = await deployFixture();
    const names = token.interface.fragments
      .filter((fragment) => fragment.type === "function")
      .map((fragment) => fragment.name);
    expect(names).to.not.include.members(["mint", "pause", "blacklist", "owner", "transferOwnership"]);
  });
});