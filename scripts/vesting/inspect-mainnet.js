const { ethers } = require("hardhat");

const TOKEN = "0xd4025a390a0b2a606f24Ea33A902D10D978715F2";
const VESTING = "0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7";

const vestingAbi = [
  "function beneficiary() view returns (address)",
  "function token() view returns (address)",
  "function cliffDuration() view returns (uint64)",
  "function totalDuration() view returns (uint64)",
  "function totalAllocation() view returns (uint256)",
  "function totalReleased() view returns (uint256)",
  "function vestedAmount() view returns (uint256)",
  "function releasable() view returns (uint256)",
  "function startTimestamp() view returns (uint64)"
];

const tokenAbi = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

async function main() {
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 56n) {
    throw new Error(`Expected BSC Mainnet (56), got ${network.chainId}`);
  }

  const vesting = new ethers.Contract(VESTING, vestingAbi, ethers.provider);
  const token = new ethers.Contract(TOKEN, tokenAbi, ethers.provider);
  const values = {
    beneficiary: await vesting.beneficiary(),
    token: await vesting.token(),
    cliffDuration: (await vesting.cliffDuration()).toString(),
    totalDuration: (await vesting.totalDuration()).toString(),
    totalAllocation: (await vesting.totalAllocation()).toString(),
    totalReleased: (await vesting.totalReleased()).toString(),
    vestedAmount: (await vesting.vestedAmount()).toString(),
    releasable: (await vesting.releasable()).toString(),
    startTimestamp: (await vesting.startTimestamp()).toString()
  };
  const latest = await ethers.provider.getBlock("latest");

  console.log(JSON.stringify({
    network: "BSC Mainnet",
    chainId: network.chainId.toString(),
    vestingContract: VESTING,
    tokenSymbol: await token.symbol(),
    tokenDecimals: Number(await token.decimals()),
    tokenTotalSupply: (await token.totalSupply()).toString(),
    vestingTokenBalance: (await token.balanceOf(VESTING)).toString(),
    readAtBlock: latest.number,
    readAtTimestamp: latest.timestamp,
    values
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});