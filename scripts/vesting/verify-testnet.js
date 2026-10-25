const hre = require("hardhat");

const token = process.env.REHEARSAL_TOKEN_ADDRESS;
const vesting = process.env.TESTNET_VESTING_ADDRESS;
const beneficiary = "0x56B6e8947ea0666108802E4BE12A46E204E7cEee";
const start = process.env.TESTNET_START_TIMESTAMP;

async function main() {
  if (!token || !vesting || !start) {
    throw new Error("Set REHEARSAL_TOKEN_ADDRESS, TESTNET_VESTING_ADDRESS, and TESTNET_START_TIMESTAMP");
  }
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) throw new Error("Missing deployer key: set DEPLOYER_PRIVATE_KEY (or BSC_TESTNET_DEPLOYER_PRIVATE_KEY)");
  await hre.run("verify:verify", {
    address: token,
    constructorArguments: [deployer.address]
  });
  await hre.run("verify:verify", {
    address: vesting,
    constructorArguments: [token, beneficiary, Number(start), 60, 300]
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});