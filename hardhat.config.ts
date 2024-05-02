import '@nomicfoundation/hardhat-ethers'
import 'hardhat-typechain'
import 'hardhat-deploy'
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
