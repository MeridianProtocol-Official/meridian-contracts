const { ethers } = require("hardhat");

const vestingAddress = process.env.TESTNET_VESTING_ADDRESS;

const erc20Abi = [
  "function balanceOf(address) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

async function main() {
  if (!vestingAddress) throw new Error("Set TESTNET_VESTING_ADDRESS");

  const [caller] = await ethers.getSigners();
  const vesting = await ethers.getContractAt("MeridianVesting", vestingAddress);
  const tokenAddress = await vesting.token();
  const token = new ethers.Contract(tokenAddress, erc20Abi, ethers.provider);
  const beneficiary = await vesting.beneficiary();
  const beforeReleasable = await vesting.releasable();
  if (beforeReleasable === 0n) throw new Error("No tokens are currently releasable");

  const tx = await vesting.release();
  const receipt = await tx.wait();
  if (receipt.status !== 1) throw new Error(`Release transaction failed: ${receipt.hash}`);

  const releasedEvent = receipt.logs
    .map((log) => {
      try {
        return vesting.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed?.name === "Released");
  if (!releasedEvent) throw new Error("Release event missing from successful receipt");

  const transferEvent = receipt.logs
    .map((log) => {
      try {
        return token.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find(
      (parsed) =>
        parsed?.name === "Transfer" &&
        parsed.args.from.toLowerCase() === vestingAddress.toLowerCase() &&
        parsed.args.to.toLowerCase() === beneficiary.toLowerCase()
    );
  if (!transferEvent) throw new Error("No beneficiary-only ERC-20 Transfer found");

  const released = releasedEvent.args.amount;
  if (transferEvent.args.value !== released) {
    throw new Error("Released event and beneficiary transfer amount differ");
  }

  console.log(`CALLER=${caller.address}`);
  console.log(`BENEFICIARY=${beneficiary}`);
  console.log(`RELEASABLE_BEFORE_TX=${beforeReleasable}`);
  console.log(`RELEASED=${released}`);
  console.log(`RELEASE_TX=${receipt.hash}`);
  console.log(`TOTAL_RELEASED_AFTER_TX=${releasedEvent.args.totalReleasedSoFar}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});