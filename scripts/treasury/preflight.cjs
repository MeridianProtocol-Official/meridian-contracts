// Read-only preflight for MeridianTreasuryTimelock. No transaction is sent.
//   bscMainnet (56): uses the documented MRDN token, owner and 72-hour delay.
//   bscTestnet (97): token / owner / delay may be overridden through
//                    TREASURY_TOKEN_ADDRESS, TREASURY_OWNER_ADDRESS and
//                    TREASURY_MIN_DELAY_SECONDS (defaults: deployer, 259200).
const hre = require("hardhat");

const EXPECTED_CHAIN_IDS = { bscTestnet: 97, bscMainnet: 56 };

const MRDN_MAINNET = "0xd4025a390a0b2a606f24Ea33A902D10D978715F2";
const CONFIRMED_OWNER = "0x9954585529c7FC22b47E6562C9726082F810903C";
const EXISTING_TREASURY_MAINNET = "0x921B238633241e14606217b9bFa2e2dE0Db67033";
const MIN_DELAY = 259200n; // 72 hours

const optionalAddress = (name) => {
  const value = process.env[name];
  if (!value) return null;
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) throw new Error(`${name} must be a valid EVM address`);
  return hre.ethers.getAddress(value);
};

async function main() {
  const expectedChainId = EXPECTED_CHAIN_IDS[hre.network.name];
  if (!expectedChainId) {
    throw new Error(`Preflight requires bscTestnet or bscMainnet, got ${hre.network.name}`);
  }
  const { ethers } = hre;
  const network = await ethers.provider.getNetwork();
  if (Number(network.chainId) !== expectedChainId) {
    throw new Error(`Wrong chain ID: expected ${expectedChainId}, received ${network.chainId}`);
  }

  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No deployer account: set DEPLOYER_PRIVATE_KEY");
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);
  const isMainnet = hre.network.name === "bscMainnet";

  const token = isMainnet ? MRDN_MAINNET : optionalAddress("TREASURY_TOKEN_ADDRESS") || deployerAddress;
  const owner = isMainnet ? CONFIRMED_OWNER : optionalAddress("TREASURY_OWNER_ADDRESS") || deployerAddress;
  const minDelay = BigInt(process.env.TREASURY_MIN_DELAY_SECONDS || MIN_DELAY.toString());
  if (minDelay < 86400n) throw new Error("minDelay must be at least 1 day (contract requirement)");

  const report = {
    network: hre.network.name,
    chainId: Number(network.chainId),
    deployerAddress,
    owner,
    token,
    minDelaySeconds: minDelay.toString(),
    balanceBNB: ethers.formatEther(balance),
  };

  if (isMainnet) {
    if (deployerAddress.toLowerCase() !== CONFIRMED_OWNER.toLowerCase()) {
      throw new Error(`Deployer ${deployerAddress} does not match the confirmed owner ${CONFIRMED_OWNER}`);
    }
    if ((await ethers.provider.getCode(MRDN_MAINNET)) === "0x") {
      throw new Error("Configured MRDN token has no code on BSC Mainnet");
    }
    report.existingTreasuryAddress = EXISTING_TREASURY_MAINNET;
    report.existingTreasuryHasCode = (await ethers.provider.getCode(EXISTING_TREASURY_MAINNET)) !== "0x";
  }

  const Treasury = await ethers.getContractFactory("MeridianTreasuryTimelock");
  const deployTx = await Treasury.getDeployTransaction(token, owner, minDelay);
  const gasEstimate = await ethers.provider.estimateGas({ from: deployerAddress, data: deployTx.data });
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;

  report.estimatedGas = gasEstimate.toString();
  report.gasPriceGwei = gasPrice ? ethers.formatUnits(gasPrice, "gwei") : null;
  report.estimatedCostBNB = gasPrice ? ethers.formatEther(gasEstimate * gasPrice) : null;
  report.note = "Read-only preflight; no transaction was broadcast. Funding the treasury is a separate manual step.";
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
