const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

const MAINNET_TOKEN = "0xd4025a390a0b2a606f24Ea33A902D10D978715F2";
const CONFIRMED_OWNER = "0x9954585529c7FC22b47E6562C9726082F810903C";
const MIN_DELAY = 259200n;
const EXISTING_TREASURY = "0x921B238633241e14606217b9bFa2e2dE0Db67033"; // already deployed

async function main() {
  if (hre.network.name !== "bscMainnet") {
    throw new Error(`This deployment is mainnet-only; got ${hre.network.name}`);
  }

  const network = await hre.ethers.provider.getNetwork();
  if (network.chainId !== 56n) {
    throw new Error(`Wrong chain ID: expected 56, received ${network.chainId}`);
  }

  const existing = await hre.ethers.provider.getCode(EXISTING_TREASURY);
  if (existing !== "0x" && process.env.ALLOW_REDEPLOY !== "true") {
    throw new Error(
      `MeridianTreasuryTimelock is already deployed at ${EXISTING_TREASURY}. Refusing to deploy a second one. ` +
        "Set ALLOW_REDEPLOY=true only if you really intend to.",
    );
  }

  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  if (deployerAddress.toLowerCase() !== CONFIRMED_OWNER.toLowerCase()) {
    throw new Error(
      `Deployer ${deployerAddress} does not match the independently confirmed owner ${CONFIRMED_OWNER}`,
    );
  }

  const Treasury = await hre.ethers.getContractFactory("MeridianTreasuryTimelock");
  const treasury = await Treasury.deploy(MAINNET_TOKEN, CONFIRMED_OWNER, MIN_DELAY);
  await treasury.waitForDeployment();

  const address = await treasury.getAddress();
  const token = new hre.ethers.Contract(
    MAINNET_TOKEN,
    ["function balanceOf(address) view returns (uint256)"],
    hre.ethers.provider,
  );
  const balance = await token.balanceOf(address);

  const deployment = {
    network: hre.network.name,
    chainId: Number(network.chainId),
    contractAddress: address,
    deployerAddress,
    constructor: {
      token: MAINNET_TOKEN,
      initialOwner: CONFIRMED_OWNER,
      minDelay: MIN_DELAY.toString(),
    },
    initialTreasuryBalance: balance.toString(),
    fundingStatus: "NOT FUNDED BY DEPLOYMENT SCRIPT",
    compiler: { version: "0.8.24", optimizer: true, runs: 200, evmVersion: "paris" },
    transactionHash: treasury.deploymentTransaction()?.hash || null,
    recordedAtUtc: new Date().toISOString(),
  };

  const outputPath = path.resolve(__dirname, "../../evidence/deployment-mainnet-treasury.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});