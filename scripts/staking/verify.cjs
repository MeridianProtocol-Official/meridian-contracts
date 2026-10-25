const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

async function main() {
  if (hre.network.name !== "bscTestnet" && hre.network.name !== "bscMainnet") {
    throw new Error(`Staking verification requires bscTestnet or bscMainnet, got ${hre.network.name}`);
  }

  const file = path.resolve(__dirname, `../../evidence/meridian-staking-${hre.network.name}.json`);
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}; deploy staking first`);
  const deployment = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!deployment.contractAddress) throw new Error("Staking deployment record has no contractAddress");
  if (!deployment.constructor?.stakingToken || !deployment.constructor?.initialOwner) {
    throw new Error("Staking deployment record is missing constructor arguments");
  }

  await hre.run("verify:verify", {
    address: deployment.contractAddress,
    constructorArguments: [
      deployment.constructor.stakingToken,
      deployment.constructor.initialOwner,
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});