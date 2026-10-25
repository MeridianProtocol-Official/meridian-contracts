const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

async function verify(address, constructorArguments, label) {
  try {
    await hre.run("verify:verify", { address, constructorArguments });
    console.log(`${label} verification submitted successfully`);
  } catch (error) {
    const message = String(error?.shortMessage || error?.reason || error?.message || error);
    if (!message.toLowerCase().includes("already verified")) {
      throw error;
    }
    console.log(`${label} was already verified`);
  }
}

async function main() {
  if (hre.network.name !== "bscTestnet") {
    throw new Error(`This verification is testnet-only; got ${hre.network.name}`);
  }

  const file = path.resolve(__dirname, "../../evidence/treasury-testnet-rehearsal.json");
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file}; run the testnet rehearsal first`);
  }
  const evidence = JSON.parse(fs.readFileSync(file, "utf8"));

  await verify(
    evidence.token.address,
    [
      evidence.token.constructor.name,
      evidence.token.constructor.symbol,
      evidence.token.constructor.supply,
      evidence.token.constructor.decimals,
      evidence.token.constructor.initialHolder,
    ],
    "Testnet token",
  );

  await verify(
    evidence.treasury.address,
    [
      evidence.treasury.constructor.token,
      evidence.treasury.constructor.initialOwner,
      evidence.treasury.constructor.minDelay,
    ],
    "MeridianTreasuryTimelock",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});