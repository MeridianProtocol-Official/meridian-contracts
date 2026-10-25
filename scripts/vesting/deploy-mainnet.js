const { ethers } = require("hardhat");

const TOKEN = "0xd4025a390a0b2a606f24Ea33A902D10D978715F2";
const BENEFICIARY = "0x56B6e8947ea0666108802E4BE12A46E204E7cEee";
const EXISTING_VESTING = "0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7"; // already deployed and funded
const CLIFF = 25920000;
const TOTAL = 94608000;

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Missing deployer key: set DEPLOYER_PRIVATE_KEY (or BSC_MAINNET_DEPLOYER_PRIVATE_KEY)");

  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 56n) throw new Error(`Expected BSC Mainnet (56), got ${network.chainId}`);

  const existing = await ethers.provider.getCode(EXISTING_VESTING);
  if (existing !== "0x" && process.env.ALLOW_REDEPLOY !== "true") {
    throw new Error(
      `MeridianVesting is already deployed at ${EXISTING_VESTING}. Refusing to deploy a second one. ` +
        "Set ALLOW_REDEPLOY=true only if you really intend to."
    );
  }

  const tokenCode = await ethers.provider.getCode(TOKEN);
  if (tokenCode === "0x") throw new Error("Configured MRDN token has no code on BSC Mainnet");
  const token = new ethers.Contract(
    TOKEN,
    [
      "function decimals() view returns (uint8)",
      "function totalSupply() view returns (uint256)"
    ],
    ethers.provider
  );
  const [decimals, totalSupply] = await Promise.all([
    token.decimals(),
    token.totalSupply()
  ]);
  if (Number(decimals) !== 18) throw new Error(`Expected MRDN to use 18 decimals, got ${decimals}`);
  if (totalSupply !== ethers.parseUnits("1000000000", 18)) {
    throw new Error(`Unexpected MRDN total supply: ${totalSupply}`);
  }

  const latest = await ethers.provider.getBlock("latest");
  if (!latest) throw new Error("Could not read latest block");
  const Vesting = await ethers.getContractFactory("MeridianVesting");
  const vesting = await Vesting.deploy(
    TOKEN,
    BENEFICIARY,
    latest.timestamp,
    CLIFF,
    TOTAL
  );
  await vesting.waitForDeployment();

  console.log(`MAINNET_DEPLOYER=${deployer.address}`);
  console.log(`TOKEN=${TOKEN}`);
  console.log(`BENEFICIARY=${BENEFICIARY}`);
  console.log(`START_TIMESTAMP=${latest.timestamp}`);
  console.log(`CLIFF_SECONDS=${CLIFF}`);
  console.log(`TOTAL_SECONDS=${TOTAL}`);
  console.log(`VESTING_CONTRACT=${await vesting.getAddress()}`);
  console.log(`VESTING_DEPLOY_TX=${vesting.deploymentTransaction().hash}`);
  console.log("No MRDN funding transfer was performed by this script.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});