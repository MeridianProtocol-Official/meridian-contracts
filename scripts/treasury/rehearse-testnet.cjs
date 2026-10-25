const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

const MIN_DELAY = 259200n; // 72 hours: exact production value
const TEST_TOKEN_SUPPLY = "1000000000";
const TREASURY_FUNDING = "150000000";
const WITHDRAWAL_AMOUNT = "1000";
const NON_OWNER_ADDRESS = "0x000000000000000000000000000000000000dEaD";

function errorText(error) {
  return String(error?.shortMessage || error?.reason || error?.message || error).slice(0, 500);
}

async function expectRevert(label, action, expectedText) {
  try {
    await action();
    return { label, passed: false, error: "Transaction did not revert" };
  } catch (error) {
    const message = errorText(error);
    return {
      label,
      passed: expectedText ? message.includes(expectedText) : true,
      error: message,
      expectedText: expectedText || null,
    };
  }
}

async function main() {
  if (hre.network.name !== "bscTestnet") {
    throw new Error(`This rehearsal is testnet-only; got ${hre.network.name}`);
  }

  const network = await hre.ethers.provider.getNetwork();
  if (network.chainId !== 97n) {
    throw new Error(`Wrong chain ID: expected 97, received ${network.chainId}`);
  }

  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const strangerAddress = NON_OWNER_ADDRESS;

  // This is a fresh testnet-only MRDN-shaped token. It is not the mainnet MRDN token.
  const Token = await hre.ethers.getContractFactory("LaunchToken");
  const token = await Token.deploy(
    "Meridian Protocol Testnet",
    "tMRDN",
    TEST_TOKEN_SUPPLY,
    18,
    deployerAddress,
  );
  await token.waitForDeployment();

  const Treasury = await hre.ethers.getContractFactory("MeridianTreasuryTimelock");
  const treasury = await Treasury.deploy(await token.getAddress(), deployerAddress, MIN_DELAY);
  await treasury.waitForDeployment();

  const fundingAmount = hre.ethers.parseUnits(TREASURY_FUNDING, 18);
  const fundingTx = await token.transfer(await treasury.getAddress(), fundingAmount);
  const fundingReceipt = await fundingTx.wait();

  const withdrawalAmount = hre.ethers.parseUnits(WITHDRAWAL_AMOUNT, 18);
  const announceTx = await treasury.announceWithdrawal(strangerAddress, withdrawalAmount);
  const announceReceipt = await announceTx.wait();
  const announceBlock = await hre.ethers.provider.getBlock(announceReceipt.blockNumber);
  const announcementLog = announceReceipt.logs
    .map((log) => {
      try {
        return treasury.interface.parseLog({ topics: log.topics, data: log.data });
      } catch {
        return null;
      }
    })
    .find((log) => log?.name === "WithdrawalAnnounced");

  if (!announcementLog) {
    throw new Error("WithdrawalAnnounced event was not found");
  }

  const [eventTo, eventAmount, eventExecutableAfter] = announcementLog.args;
  const expectedExecutableAfter = BigInt(announceBlock.timestamp) + MIN_DELAY;
  if (
    eventTo.toLowerCase() !== strangerAddress.toLowerCase() ||
    eventAmount !== withdrawalAmount ||
    eventExecutableAfter !== expectedExecutableAfter
  ) {
    throw new Error("WithdrawalAnnounced event arguments did not match the expected values");
  }

  const earlyExecution = await expectRevert(
    "executeWithdrawal before 72-hour delay",
    () => treasury.executeWithdrawal(),
    "delay has not elapsed yet",
  );

  const cancelTx = await treasury.cancelWithdrawal();
  const cancelReceipt = await cancelTx.wait();
  const pendingAfterCancel = await treasury.pending();
  if (pendingAfterCancel.exists) {
    throw new Error("Pending withdrawal still exists after cancellation");
  }

  const nonOwnerChecks = [];
  nonOwnerChecks.push(
    await expectRevert(
      "non-owner announceWithdrawal",
      async () =>
        hre.ethers.provider.call({
          to: await treasury.getAddress(),
          from: strangerAddress,
          data: treasury.interface.encodeFunctionData("announceWithdrawal", [
            strangerAddress,
            withdrawalAmount,
          ]),
        }),
    ),
  );
  nonOwnerChecks.push(
    await expectRevert(
      "non-owner cancelWithdrawal",
      async () =>
        hre.ethers.provider.call({
          to: await treasury.getAddress(),
          from: strangerAddress,
          data: treasury.interface.encodeFunctionData("cancelWithdrawal"),
        }),
    ),
  );
  nonOwnerChecks.push(
    await expectRevert(
      "non-owner executeWithdrawal",
      async () =>
        hre.ethers.provider.call({
          to: await treasury.getAddress(),
          from: strangerAddress,
          data: treasury.interface.encodeFunctionData("executeWithdrawal"),
        }),
    ),
  );

  const renounceCheck = await expectRevert(
    "owner renounceOwnership",
    () => treasury.renounceOwnership(),
    "renounceOwnership disabled: would permanently lock treasury funds",
  );

  const checks = {
    deployment: true,
    chainId: Number(network.chainId),
    exactProductionDelaySeconds: MIN_DELAY.toString(),
    shortenedDelayUsed: false,
    announcementEvent: true,
    earlyExecution,
    cancellation: {
      passed: true,
      transactionHash: cancelReceipt.hash,
      pendingExistsAfterCancel: pendingAfterCancel.exists,
    },
    nonOwnerChecks,
    renounceOwnership: renounceCheck,
  };

  if (
    !earlyExecution.passed ||
    !renounceCheck.passed ||
    nonOwnerChecks.some((check) => !check.passed)
  ) {
    throw new Error(`One or more rehearsal checks failed: ${JSON.stringify(checks, null, 2)}`);
  }

  const evidence = {
    rehearsal: "BSC Testnet exact production-delay rehearsal",
    note: "Fresh testnet-only tMRDN token and treasury instance; no mainnet token, owner, or funds used.",
    network: hre.network.name,
    chainId: Number(network.chainId),
    deployerAddress,
    nonOwnerAddress: strangerAddress,
    token: {
      address: await token.getAddress(),
      transactionHash: token.deploymentTransaction()?.hash || null,
      constructor: {
        name: "Meridian Protocol Testnet",
        symbol: "tMRDN",
        supply: TEST_TOKEN_SUPPLY,
        decimals: 18,
        initialHolder: deployerAddress,
      },
    },
    treasury: {
      address: await treasury.getAddress(),
      transactionHash: treasury.deploymentTransaction()?.hash || null,
      constructor: {
        token: await token.getAddress(),
        initialOwner: deployerAddress,
        minDelay: MIN_DELAY.toString(),
      },
    },
    funding: {
      amount: fundingAmount.toString(),
      transactionHash: fundingReceipt.hash,
    },
    announcement: {
      to: strangerAddress,
      amount: withdrawalAmount.toString(),
      transactionHash: announceReceipt.hash,
      blockNumber: announceReceipt.blockNumber,
      blockTimestamp: announceBlock.timestamp,
      executableAfter: eventExecutableAfter.toString(),
      eventVerified: true,
    },
    cancellation: {
      transactionHash: cancelReceipt.hash,
      pendingExistsAfterCancel: pendingAfterCancel.exists,
    },
    checks,
    compiler: {
      version: "0.8.24",
      optimizer: true,
      runs: 200,
      evmVersion: "paris",
    },
    recordedAtUtc: new Date().toISOString(),
  };

  const outputPath = path.resolve(__dirname, "../../evidence/treasury-testnet-rehearsal.json");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});