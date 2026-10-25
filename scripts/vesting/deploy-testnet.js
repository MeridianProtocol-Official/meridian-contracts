const { ethers } = require("hardhat");

const BENEFICIARY = "0x56B6e8947ea0666108802E4BE12A46E204E7cEee";
const TEST_CLIFF = 60;
const TEST_TOTAL = 300;
const TEST_ALLOCATION = ethers.parseUnits("1000000", 18);

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Missing deployer key: set DEPLOYER_PRIVATE_KEY (or BSC_TESTNET_DEPLOYER_PRIVATE_KEY)");

  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 97n) throw new Error(`Expected BSC Testnet (97), got ${network.chainId}`);

  console.log(`Testnet deployer: ${deployer.address}`);
  console.log(`Fixed beneficiary: ${BENEFICIARY}`);
  console.log("This script deploys only a rehearsal token and a scaled-timing vesting contract.");

  const Token = await ethers.getContractFactory("RehearsalToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  console.log(`REHEARSAL_TOKEN=${await token.getAddress()}`);
  await token.deploymentTransaction().wait();

  const latest = await ethers.provider.getBlock("latest");
  if (!latest) throw new Error("Could not read latest block");
  const Vesting = await ethers.getContractFactory("MeridianVesting");
  const vesting = await Vesting.deploy(
    await token.getAddress(),
    BENEFICIARY,
    latest.timestamp,
    TEST_CLIFF,
    TEST_TOTAL
  );
  await vesting.waitForDeployment();
  console.log(`VESTING_CONTRACT=${await vesting.getAddress()}`);
  console.log(`VESTING_DEPLOY_TX=${vesting.deploymentTransaction().hash}`);

  const transfer = await token.transfer(await vesting.getAddress(), TEST_ALLOCATION);
  await transfer.wait();
  console.log(`FUNDING_TX=${transfer.hash}`);
  console.log(`TEST_CLIFF_SECONDS=${TEST_CLIFF}`);
  console.log(`TEST_TOTAL_SECONDS=${TEST_TOTAL}`);
  console.log("Wait at least 60 seconds, then inspect releasable() before calling release().");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});