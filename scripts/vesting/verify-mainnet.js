const hre = require("hardhat");

const TOKEN = "0xd4025a390a0b2a606f24Ea33A902D10D978715F2";
const BENEFICIARY = "0x56B6e8947ea0666108802E4BE12A46E204E7cEee";
const vesting = process.env.MAINNET_VESTING_ADDRESS;
const start = process.env.MAINNET_START_TIMESTAMP;

async function main() {
  if (!vesting || !start) {
    throw new Error("Set MAINNET_VESTING_ADDRESS and MAINNET_START_TIMESTAMP");
  }
  await hre.run("verify:verify", {
    address: vesting,
    constructorArguments: [TOKEN, BENEFICIARY, Number(start), 25920000, 94608000]
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});