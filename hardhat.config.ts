import '@nomicfoundation/hardhat-ethers'
import 'hardhat-typechain'
import 'hardhat-deploy'
import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

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

const blastURI = process.env.BLAST_URI || '';
const sepoliaURI = process.env.SEPOLIA_URI || '';
const mnemonic = process.env.MNEMONIC || '';
const localURI = 'http://localhost:8545';

export default {
  networks: {
    localhost: {
      accounts: [localhostAccount],
      allowUnlimitedContractSize: true,
    },
    sepolia: {
      url: sepoliaURI,
      allowUnlimitedContractSize: false,
      accounts: {
        mnemonic: mnemonic,
      },
    }
  },
  namedAccounts: {
    deployer: {
      default: 0,
    }
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
