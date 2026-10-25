const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

const requiredAddress = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`${name} must be a valid EVM address`);
  }
  return hre.ethers.getAddress(value);
};

async function main() {
  const expectedChainId = hre.network.name === "bscTestnet"
    ? 97
    : hre.network.name === "bscMainnet"
      ? 56
      : null;
  if (!expectedChainId) {
    throw new Error(`Deployment is only allowed on bscTestnet or bscMainnet, got ${hre.network.name}`);
  }

  const stakingToken = requiredAddress("STAKING_TOKEN_ADDRESS");
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  if (hre.network.name === "bscMainnet" && !process.env.INITIAL_OWNER) {
    throw new Error("INITIAL_OWNER is required for mainnet staking deployment");
  }
  const initialOwner = process.env.INITIAL_OWNER
    ? requiredAddress("INITIAL_OWNER")
    : deployerAddress;

  const network = await hre.ethers.provider.getNetwork();
  if (Number(network.chainId) !== expectedChainId) {
    throw new Error(`Wrong chain ID: expected ${expectedChainId}, received ${network.chainId}`);
  }

  const recordPath = path.resolve(__dirname, `../../evidence/meridian-staking-${hre.network.name}.json`);
  if (hre.network.name === "bscMainnet" && fs.existsSync(recordPath) && process.env.ALLOW_REDEPLOY !== "true") {
    throw new Error(
      `${recordPath} already exists: MeridianStaking is already deployed on mainnet. ` +
        "Refusing to deploy a second instance. Set ALLOW_REDEPLOY=true only if you really intend to.",
    );
  }

  const Staking = await hre.ethers.getContractFactory("MeridianStaking");
  const staking = await Staking.deploy(stakingToken, initialOwner);
  await staking.waitForDeployment();
  const deploymentTx = staking.deploymentTransaction();
  const receipt = deploymentTx ? await deploymentTx.wait() : null;
  const contractAddress = await staking.getAddress();
  const deployment = {
    network: hre.network.name,
    chainId: Number(network.chainId),
    contractAddress,
    deployerAddress,
    constructor: { stakingToken, initialOwner },
    compiler: { version: "0.8.24", optimizer: true, runs: 200, evmVersion: "paris" },
    transactionHash: deploymentTx?.hash || null,
    blockNumber: receipt?.blockNumber ?? null,
    receiptStatus: receipt?.status ?? null,
    recordedAtUtc: new Date().toISOString(),
  };

  const outputPath = path.resolve(__dirname, `../../evidence/meridian-staking-${hre.network.name}.json`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});