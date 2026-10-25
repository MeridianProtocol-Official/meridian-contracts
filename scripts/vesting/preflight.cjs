// Read-only preflight for MeridianVesting. No transaction is sent.
//   bscMainnet (56): checks the real MRDN token, the fixed beneficiary and the
//                    300-day / 1,095-day schedule, and reports whether the
//                    vesting contract is already deployed.
//   bscTestnet (97): checks balance and gas for the scaled-timing rehearsal.
const hre = require("hardhat");

const EXPECTED_CHAIN_IDS = { bscTestnet: 97, bscMainnet: 56 };

const MRDN_MAINNET = "0xd4025a390a0b2a606f24Ea33A902D10D978715F2";
const BENEFICIARY = "0x56B6e8947ea0666108802E4BE12A46E204E7cEee";
const EXISTING_VESTING_MAINNET = "0xCb89849805B44A9D8Ee11B5D40cd6962d4fF93f7";
const MAINNET_CLIFF = 25920000; // 300 days
const MAINNET_TOTAL = 94608000; // 1,095 days
const TESTNET_CLIFF = 60;
const TESTNET_TOTAL = 300;

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
  const latest = await ethers.provider.getBlock("latest");
  if (!latest) throw new Error("Could not read latest block");

  const isMainnet = hre.network.name === "bscMainnet";
  const report = {
    network: hre.network.name,
    chainId: Number(network.chainId),
    deployerAddress,
    balanceBNB: ethers.formatEther(balance),
    beneficiary: BENEFICIARY,
    cliffSeconds: isMainnet ? MAINNET_CLIFF : TESTNET_CLIFF,
    totalSeconds: isMainnet ? MAINNET_TOTAL : TESTNET_TOTAL,
  };

  let tokenAddress;
  if (isMainnet) {
    const tokenCode = await ethers.provider.getCode(MRDN_MAINNET);
    if (tokenCode === "0x") throw new Error("Configured MRDN token has no code on BSC Mainnet");
    const token = new ethers.Contract(
      MRDN_MAINNET,
      ["function decimals() view returns (uint8)", "function totalSupply() view returns (uint256)"],
      ethers.provider,
    );
    const [decimals, totalSupply] = await Promise.all([token.decimals(), token.totalSupply()]);
    if (Number(decimals) !== 18) throw new Error(`Expected MRDN to use 18 decimals, got ${decimals}`);
    if (totalSupply !== ethers.parseUnits("1000000000", 18)) {
      throw new Error(`Unexpected MRDN total supply: ${totalSupply}`);
    }
    tokenAddress = MRDN_MAINNET;
    report.token = MRDN_MAINNET;
    report.existingVestingAddress = EXISTING_VESTING_MAINNET;
    report.existingVestingHasCode = (await ethers.provider.getCode(EXISTING_VESTING_MAINNET)) !== "0x";
  } else {
    // Testnet rehearsal deploys its own RehearsalToken; use the deployer as a
    // non-zero stand-in only to estimate the vesting constructor gas.
    tokenAddress = deployerAddress;
    report.token = "RehearsalToken (deployed by the rehearsal script)";
  }

  const Vesting = await ethers.getContractFactory("MeridianVesting");
  const deployTx = await Vesting.getDeployTransaction(
    tokenAddress,
    BENEFICIARY,
    latest.timestamp,
    report.cliffSeconds,
    report.totalSeconds,
  );
  const gasEstimate = await ethers.provider.estimateGas({ from: deployerAddress, data: deployTx.data });
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;

  report.estimatedGas = gasEstimate.toString();
  report.gasPriceGwei = gasPrice ? ethers.formatUnits(gasPrice, "gwei") : null;
  report.estimatedCostBNB = gasPrice ? ethers.formatEther(gasEstimate * gasPrice) : null;
  report.note = "Read-only preflight; no transaction was broadcast. Funding is a separate, irreversible step.";
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
