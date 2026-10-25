const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

const NETWORK_LABEL = { bscTestnet: "testnet", bscMainnet: "mainnet" };

async function main() {
  const label = NETWORK_LABEL[hre.network.name];
  if (!label) {
    throw new Error(`Verification requires bscTestnet or bscMainnet, got ${hre.network.name}`);
  }

  // Reads the record written by scripts/token/deploy.cjs (or the committed
  // mainnet record in evidence/deployment-mainnet.json).
  const file = path.resolve(__dirname, `../../evidence/deployment-${label}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}; deploy or fill it first`);
  const deployment = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!deployment.contractAddress) throw new Error("deployment record has no contractAddress");

  await hre.run("verify:verify", {
    address: deployment.contractAddress,
    constructorArguments: [
      deployment.constructor.name,
      deployment.constructor.symbol,
      deployment.constructor.supply,
      deployment.constructor.decimals,
      deployment.constructor.initialHolder,
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
