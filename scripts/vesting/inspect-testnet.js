const { ethers } = require("hardhat");

const tokenAddress = process.env.REHEARSAL_TOKEN_ADDRESS;
const vestingAddress = process.env.TESTNET_VESTING_ADDRESS;

const erc20Abi = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

async function main() {
  if (!tokenAddress || !vestingAddress) {
    throw new Error("Set REHEARSAL_TOKEN_ADDRESS and TESTNET_VESTING_ADDRESS");
  }

  const vesting = await ethers.getContractAt("MeridianVesting", vestingAddress);
  const token = new ethers.Contract(tokenAddress, erc20Abi, ethers.provider);
  const [beneficiary, start, cliff, total, totalAllocation, releasable, latest] =
    await Promise.all([
      vesting.beneficiary(),
      vesting.startTimestamp(),
      vesting.cliffDuration(),
      vesting.totalDuration(),
      vesting.totalAllocation(),
      vesting.releasable(),
      ethers.provider.getBlock("latest")
    ]);

  console.log(`TOKEN=${tokenAddress}`);
  console.log(`TOKEN_SYMBOL=${await token.symbol()}`);
  console.log(`TOKEN_DECIMALS=${await token.decimals()}`);
  console.log(`VESTING=${vestingAddress}`);
  console.log(`BENEFICIARY=${beneficiary}`);
  console.log(`START_TIMESTAMP=${start}`);
  console.log(`CLIFF_END=${start + cliff}`);
  console.log(`VEST_END=${start + total}`);
  console.log(`LATEST_TIMESTAMP=${latest.timestamp}`);
  console.log(`TOTAL_ALLOCATION=${totalAllocation}`);
  console.log(`RELEASABLE=${releasable}`);
  console.log(`BENEFICIARY_BALANCE=${await token.balanceOf(beneficiary)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});