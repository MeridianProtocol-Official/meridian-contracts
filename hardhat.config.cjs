require("dotenv/config");
require("@nomicfoundation/hardhat-toolbox");

// First defined value among the given environment variable names.
const pick = (...names) => names.map((name) => process.env[name]).find(Boolean);

// Per-network key wins; DEPLOYER_PRIVATE_KEY is the shared fallback.
const accountsFor = (...names) => {
  const key = pick(...names);
  return key ? [key] : [];
};

const networkConfig = (urlName, chainId, keyNames) => ({
  // Keep compile/test commands offline-friendly. Deployment scripts validate
  // these values before connecting to a live network.
  url: process.env[urlName] || "",
  chainId,
  accounts: accountsFor(...keyNames),
});

// Settings recorded in the deployment evidence for MRDN, MeridianStaking and
// MeridianTreasuryTimelock: solc 0.8.24, optimizer on (200 runs), EVM "paris".
const DEFAULT_SETTINGS = {
  optimizer: { enabled: true, runs: 200 },
  evmVersion: "paris",
};

// MeridianVesting was compiled and verified with the optimizer DISABLED and the
// compiler's default EVM version. These settings must stay different from the
// others, otherwise the bytecode will not match the verified BscScan source.
const VESTING_SETTINGS = {
  optimizer: { enabled: false, runs: 200 },
  metadata: { bytecodeHash: "ipfs" },
};

module.exports = {
  solidity: {
    compilers: [{ version: "0.8.24", settings: DEFAULT_SETTINGS }],
    overrides: {
      "contracts/MeridianVesting.sol": { version: "0.8.24", settings: VESTING_SETTINGS },
      // Test-only token used by the vesting tests and the testnet rehearsal.
      "contracts/mocks/RehearsalToken.sol": { version: "0.8.24", settings: VESTING_SETTINGS },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: { chainId: 31337 },
    bscTestnet: networkConfig("BSC_TESTNET_RPC_URL", 97, [
      "BSC_TESTNET_DEPLOYER_PRIVATE_KEY",
      "DEPLOYER_PRIVATE_KEY",
    ]),
    bscMainnet: networkConfig("BSC_MAINNET_RPC_URL", 56, [
      "BSC_MAINNET_DEPLOYER_PRIVATE_KEY",
      "DEPLOYER_PRIVATE_KEY",
    ]),
  },
  etherscan: {
    // Single Etherscan V2 API key (works for all chains via chainId routing).
    apiKey: pick("ETHERSCAN_API_KEY", "BSCSCAN_API_KEY") || "",
    customChains: [
      {
        network: "bscTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=97",
          browserURL: "https://testnet.bscscan.com",
        },
      },
      {
        network: "bscMainnet",
        chainId: 56,
        urls: {
          apiURL: "https://api.etherscan.io/v2/api?chainid=56",
          browserURL: "https://bscscan.com",
        },
      },
    ],
  },
};
