const { ethers } = require("hardhat");

const BENEFICIARY = "0x56B6e8947ea0666108802E4BE12A46E204E7cEee";
const CLIFF = 60;
const TOTAL = 300;
const ALLOCATION = ethers.parseUnits("1000000", 18);

async function waitUntilTimestamp(target) {
  for (;;) {
    const block = await ethers.provider.getBlock("latest");
    if (block && block.timestamp >= target) return block;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Missing deployer key: set DEPLOYER_PRIVATE_KEY (or BSC_TESTNET_DEPLOYER_PRIVATE_KEY)");

  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 97n) {
    throw new Error(`Expected BSC Testnet (97), got ${network.chainId}`);
  }

  const Token = await ethers.getContractFactory("RehearsalToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  const tokenDeploymentReceipt = await token.deploymentTransaction().wait();

  const startBlock = await ethers.provider.getBlock("latest");
  if (!startBlock) throw new Error("Could not read latest block");

  const Vesting = await ethers.getContractFactory("MeridianVesting");
  const vesting = await Vesting.deploy(
    tokenAddress,
    BENEFICIARY,
    startBlock.timestamp,
    CLIFF,
    TOTAL
  );
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  const vestingDeploymentReceipt = await vesting.deploymentTransaction().wait();

  const funding = await token.transfer(vestingAddress, ALLOCATION);
  const fundingReceipt = await funding.wait();
  if (!fundingReceipt || fundingReceipt.status !== 1) {
    throw new Error(`Testnet funding failed: ${funding.hash}`);
  }

  const beforeCliff = await vesting.releasable();
  if (beforeCliff !== 0n) {
    throw new Error(`Expected zero releasable before cliff, got ${beforeCliff}`);
  }

  // Override gas estimation so the intentionally reverting transaction is
  // actually broadcast and mined for evidence.
  const reverted = await vesting.release({ gasLimit: 200000 });
  const revertedHash = reverted.hash;
  if (!revertedHash) {
    throw new Error("Could not capture the pre-cliff release transaction hash");
  }
  try {
    await reverted.wait();
  } catch {
    // Expected: this transaction must revert before the cliff.
  }
  const revertedReceipt = await ethers.provider.getTransactionReceipt(revertedHash);
  if (!revertedReceipt || revertedReceipt.status !== 0) {
    throw new Error(`Expected a mined reverted transaction: ${revertedHash}`);
  }

  const afterCliffBlock = await waitUntilTimestamp(startBlock.timestamp + CLIFF + 1);
  const beforeRelease = await vesting.releasable();
  if (beforeRelease === 0n) {
    throw new Error("Expected a positive post-cliff releasable amount");
  }

  const release = await vesting.release();
  const releaseReceipt = await release.wait();
  if (!releaseReceipt || releaseReceipt.status !== 1) {
    throw new Error(`Post-cliff release failed: ${release.hash}`);
  }

  const finalBalance = await token.balanceOf(BENEFICIARY);
  const finalReleasable = await vesting.releasable();
  if (finalBalance !== ALLOCATION || finalReleasable !== 0n) {
    throw new Error(
      `Unexpected final state: beneficiary=${finalBalance}, releasable=${finalReleasable}`
    );
  }

  console.log(`TOKEN=${tokenAddress}`);
  console.log(`TOKEN_DEPLOY_TX=${tokenDeploymentReceipt.hash}`);
  console.log(`VESTING_CONTRACT=${vestingAddress}`);
  console.log(`VESTING_DEPLOY_TX=${vestingDeploymentReceipt.hash}`);
  console.log(`FUNDING_TX=${fundingReceipt.hash}`);
  console.log(`START_TIMESTAMP=${startBlock.timestamp}`);
  console.log(`CLIFF_SECONDS=${CLIFF}`);
  console.log(`TOTAL_SECONDS=${TOTAL}`);
  console.log(`CLIFF_REVERT_TX=${revertedHash}`);
  console.log(`CLIFF_REVERT_STATUS=${revertedReceipt.status}`);
  console.log(`POST_CLIFF_BLOCK=${afterCliffBlock.number}`);
  console.log(`POST_CLIFF_RELEASE_TX=${releaseReceipt.hash}`);
  console.log(`BENEFICIARY_FINAL_BALANCE=${ethers.formatUnits(finalBalance, 18)}`);
  console.log(`FINAL_RELEASABLE=${ethers.formatUnits(finalReleasable, 18)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});