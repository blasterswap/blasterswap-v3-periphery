import '@nomicfoundation/hardhat-ethers'
import 'hardhat-typechain'
import 'hardhat-deploy'
import "@nomicfoundation/hardhat-verify";
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { Wallet } from 'ethers';

const localhostAccount = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const LOW_OPTIMIZER_COMPILER_SETTINGS = {
  version: '0.7.6',
  settings: {
    evmVersion: 'istanbul',
    optimizer: {
      enabled: true,
      runs: 2_00,
    },
    metadata: {
      bytecodeHash: 'none',
    },
  },
}

const LOWEST_OPTIMIZER_COMPILER_SETTINGS = {
  version: '0.7.6',
  settings: {
    evmVersion: 'istanbul',
    optimizer: {
      enabled: true,
      runs: 1_000,
    },
    metadata: {
      bytecodeHash: 'none',
    },
  },
}

const DEFAULT_COMPILER_SETTINGS = {
  version: '0.7.6',
  settings: {
    evmVersion: 'istanbul',
    optimizer: {
      enabled: true,
      runs: 1_000_000,
    },
    metadata: {
      bytecodeHash: 'none',
    },
  },
}

dotenvConfig({ path: resolve(__dirname, './.env') });


const BLAST_RPC_URI = process.env.BLAST_RPC_URI || '';
const SEPOLIA_RPC_URI = process.env.SEPOLIA_RPC_URI || '';
const BLAST_PRIVATE_KEY = process.env.BLAST_PRIVATE_KEY || '';
const LOCAL_URI = 'http://localhost:8545';

const BLASTSCAN_API_KEY = process.env.BLASTSCAN_API_KEY || '';
const SEPOLIASCAN_API_KEY = process.env.ETHERSCAN_API_KEY_ETH_SEPOLIA || '';


export default {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
    },
    blast: {
      url: BLAST_RPC_URI,
      chainId: 81457,
      accounts: [
        Wallet.fromPhrase(BLAST_PRIVATE_KEY).privateKey
      ]
    },
  },
  namedAccounts: {
    deployer: 0
  },
  etherscan: {
    apiKey: {
      blast: BLASTSCAN_API_KEY,
    },
    customChains: [
      {
        network: "blast",
        chainId: 81457,
        urls: {
          apiURL: "https://api.blastscan.io/api",
          browserURL: "https://blastscan.io"
        }
      }
    ]
  },
  solidity: {
    compilers: [DEFAULT_COMPILER_SETTINGS],
    overrides: {
      'contracts/NonfungiblePositionManager.sol': LOW_OPTIMIZER_COMPILER_SETTINGS,
      'contracts/test/MockTimeNonfungiblePositionManager.sol': LOW_OPTIMIZER_COMPILER_SETTINGS,
      'contracts/test/NFTDescriptorTest.sol': LOWEST_OPTIMIZER_COMPILER_SETTINGS,
      'contracts/NonfungibleTokenPositionDescriptor.sol': LOWEST_OPTIMIZER_COMPILER_SETTINGS,
      'contracts/libraries/NFTDescriptor.sol': LOWEST_OPTIMIZER_COMPILER_SETTINGS,
    },
  },
  watcher: {
    test: {
      tasks: [{ command: 'test', params: { testFiles: ['{path}'] } }],
      files: ['./test/**/*'],
      verbose: true,
    },
  },
}



// deploying "BlasterswapInterfaceMulticall": 0x766a8ac9322526BAeF713A9a8e26DeaDaA3f770F
// proxy deployed to: 0xF2Ea815B0bA6D6b564f14c6eAe7B6A7EEC580a9B
// deploying "TickLens":0xEdcB941e34B7D4b0EcAF6A2FD8D2F051ad4955f5
// deploying "NFTDescriptor":0x0C0E0Ce7592d93FC5861385a87A9A6d236385F19
// deploying "NonfungibleTokenPositionDescriptor": 0x3f2939d2117B7a9900B616Db6159f8f68D85b315
// TransparentUpgradeableProxy deployed to: 0x12Bf7475d8CCE779a2ec74E5bC7C9EF06961cb0B
// BlasterswapInterfaceMulticall: 0x766a8ac9322526BAeF713A9a8e26DeaDaA3f770F
// TickLens: 0xEdcB941e34B7D4b0EcAF6A2FD8D2F051ad4955f5
// NFTDescriptor: 0x0C0E0Ce7592d93FC5861385a87A9A6d236385F19
// NonfungibleTokenPositionDescriptor: 0x3f2939d2117B7a9900B616Db6159f8f68D85b315
// NonfungiblePositionManager: 0x4b314C696211c8362e20b7a5363583feE7319410
// V3Migrator: 0x2a9ee80b5893367E48F1C4C026220aC02b743463
// QuoterV2: 0x3C95Ba0B70E57E717d09CACb48Ca9e110d1f25DE
// SwapRouter: 0xee642de8695De7c36f1a8e4f5ED0CD21160ab1F2
