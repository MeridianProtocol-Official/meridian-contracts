const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

async function main() {
  if (hre.network.name !== "bscMainnet") {
    throw new Error(`This verification is mainnet-only; got ${hre.network.name}`);
  }

  const file = path.resolve(__dirname, "../../evidence/deployment-mainnet-treasury.json");
  // This repo ships no deployment-mainnet-treasury.json. If it is absent, use the
  // documented mainnet constructor arguments (see docs/TREASURY_TIMELOCK.md and README).
  const deployment = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, "utf8"))
    : {
        contractAddress: "0x921B238633241e14606217b9bFa2e2dE0Db67033",
        constructor: {
          token: "0xd4025a390a0b2a606f24Ea33A902D10D978715F2",
          initialOwner: "0x9954585529c7FC22b47E6562C9726082F810903C",
          minDelay: "259200",
        },
      };

  try {
    await hre.run("verify:verify", {
      address: deployment.contractAddress,
      constructorArguments: [
        deployment.constructor.token,
        deployment.constructor.initialOwner,
        deployment.constructor.minDelay,
      ],
    });
    console.log("MeridianTreasuryTimelock mainnet verification submitted successfully");
  } catch (error) {
    const message = String(error?.shortMessage || error?.reason || error?.message || error);
    if (!message.toLowerCase().includes("already verified")) {
      throw error;
    }
    console.log("MeridianTreasuryTimelock mainnet contract was already verified");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});