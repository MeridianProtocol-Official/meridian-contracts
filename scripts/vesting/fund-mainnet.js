const { ethers } = require("hardhat");

const TOKEN = "0xd4025a390a0b2a606f24Ea33A902D10D978715F2";
const VESTING = "0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7";
const ALLOCATION = ethers.parseUnits("180000000", 18);

const erc20Abi = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Missing deployer key: set DEPLOYER_PRIVATE_KEY (or BSC_MAINNET_DEPLOYER_PRIVATE_KEY)");

  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 56n) {
    throw new Error(`Expected BSC Mainnet (56), got ${network.chainId}`);
  }

  const vestingCode = await ethers.provider.getCode(VESTING);
  if (vestingCode === "0x") {
    throw new Error(`No contract code at configured vesting address ${VESTING}`);
  }

  const token = new ethers.Contract(TOKEN, erc20Abi, deployer);
  const [decimals, totalSupply, deployerBalance, currentVestingBalance] =
    await Promise.all([
      token.decimals(),
      token.totalSupply(),
      token.balanceOf(deployer.address),
      token.balanceOf(VESTING)
    ]);

  if (Number(decimals) !== 18) {
    throw new Error(`Expected MRDN to use 18 decimals, got ${decimals}`);
  }
  if (totalSupply !== ethers.parseUnits("1000000000", 18)) {
    throw new Error(`Unexpected MRDN total supply: ${totalSupply}`);
  }
  if (currentVestingBalance !== 0n) {
    throw new Error(
      `Refusing duplicate funding: vesting already holds ${currentVestingBalance} base units`
    );
  }
  if (deployerBalance < ALLOCATION) {
    throw new Error(
      `Insufficient MRDN balance: have ${deployerBalance}, need ${ALLOCATION}`
    );
  }

  const transfer = await token.transfer(VESTING, ALLOCATION);
  const receipt = await transfer.wait();
  if (!receipt || receipt.status !== 1) {
    throw new Error(`Funding transaction failed: ${transfer.hash}`);
  }

  const finalVestingBalance = await token.balanceOf(VESTING);
  if (finalVestingBalance !== ALLOCATION) {
    throw new Error(
      `Unexpected post-funding balance: ${finalVestingBalance}; expected ${ALLOCATION}`
    );
  }

  console.log(`TOKEN=${TOKEN}`);
  console.log(`VESTING_CONTRACT=${VESTING}`);
  console.log(`FUNDER=${deployer.address}`);
  console.log(`FUNDING_AMOUNT=${ethers.formatUnits(ALLOCATION, 18)} MRDN`);
  console.log(`FUNDING_TX=${receipt.hash}`);
  console.log(
    `VESTING_BALANCE=${ethers.formatUnits(finalVestingBalance, 18)} MRDN`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});