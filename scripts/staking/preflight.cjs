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
    throw new Error(`Staking preflight requires bscTestnet or bscMainnet, got ${hre.network.name}`);
  }

  const network = await hre.ethers.provider.getNetwork();
  if (Number(network.chainId) !== expectedChainId) {
    throw new Error(`Wrong chain ID: expected ${expectedChainId}, received ${network.chainId}`);
  }

  const stakingToken = requiredAddress("STAKING_TOKEN_ADDRESS");
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  if (hre.network.name === "bscMainnet" && !process.env.INITIAL_OWNER) {
    throw new Error("INITIAL_OWNER is required for mainnet staking preflight");
  }
  const initialOwner = process.env.INITIAL_OWNER ? requiredAddress("INITIAL_OWNER") : deployerAddress;

  const token = await hre.ethers.getContractAt(
    [
      "function balanceOf(address) view returns (uint256)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
    ],
    stakingToken,
  );
  const [bnbBalance, tokenBalance, symbol, decimals] = await Promise.all([
    hre.ethers.provider.getBalance(deployerAddress),
    token.balanceOf(deployerAddress),
    token.symbol(),
    token.decimals(),
  ]);

  const Staking = await hre.ethers.getContractFactory("MeridianStaking");
  const deployTx = await Staking.getDeployTransaction(stakingToken, initialOwner);
  const estimatedGas = await hre.ethers.provider.estimateGas({
    from: deployerAddress,
    data: deployTx.data,
  });
  const feeData = await hre.ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;
  const estimatedCost = gasPrice ? estimatedGas * gasPrice : null;

  console.log(JSON.stringify({
    network: hre.network.name,
    chainId: Number(network.chainId),
    deployerAddress,
    initialOwner,
    stakingToken,
    bnbBalance: hre.ethers.formatEther(bnbBalance),
    tokenBalance: hre.ethers.formatUnits(tokenBalance, decimals),
    tokenSymbol: symbol,
    estimatedGas: estimatedGas.toString(),
    gasPriceGwei: gasPrice ? hre.ethers.formatUnits(gasPrice, "gwei") : null,
    estimatedCostBNB: estimatedCost ? hre.ethers.formatEther(estimatedCost) : null,
    note: "Read-only preflight; no transaction was broadcast.",
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});