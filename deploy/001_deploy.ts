import { getNamedAccounts, deployments } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { asciiStringToBytes32 } from './utils/utils';
import ProxyAdmin from '@openzeppelin/contracts/build/contracts/ProxyAdmin.json'
import TransparentProxy from '@openzeppelin/contracts/build/contracts/TransparentUpgradeableProxy.json';
import { ZeroAddress } from 'ethers';

const WETH9Address = "0x4300000000000000000000000000000000000004";
const nativeCurrencySymbol = "ETH";
const v3CoreFactoryAddress = "0x3762546c6041bb0f8e7de7910599242c3711a28c";
const gasAdmin = "0x2AcF0a024a4Fd16E3A0CDDdB32FC229759290a1e";

module.exports = async (hre: HardhatRuntimeEnvironment) => {
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();
	const [deployerSigner] = await hre.ethers.getSigners();

	if (gasAdmin == ZeroAddress) {
		throw new Error("gasAdmin address is not set");
	}

	const multicall = await deploy("BlasterswapInterfaceMulticall", {
		from: deployer,
		log: true
	});

	const Proxy = await hre.ethers.getContractFactory(ProxyAdmin.abi, ProxyAdmin.bytecode, deployerSigner);
	const proxy = await Proxy.deploy();
	await proxy.waitForDeployment();
	const proxyAddress = await proxy.getAddress();
	console.log("proxy deployed to:", await proxy.getAddress());

	const tickLense = await deploy("TickLens", {
		from: deployer,
		log: true
	});

	const nftDescriptor = await deploy("NFTDescriptor", {
		from: deployer,
		log: true
	});

	const nonfungibleTokenPositionDescriptor = await deploy("NonfungibleTokenPositionDescriptor", {
		from: deployer,
		args: [WETH9Address, asciiStringToBytes32(nativeCurrencySymbol)],
		log: true,
		libraries: {
			NFTDescriptor: nftDescriptor.address
		},
	});

	const TransparentUpgradeableProxy = await hre.ethers.getContractFactory(TransparentProxy.abi, TransparentProxy.bytecode, deployerSigner);
	const nonfungibleTokenDescriptorProxy = await TransparentUpgradeableProxy.deploy(nonfungibleTokenPositionDescriptor.address, proxyAddress, "0x");
	await nonfungibleTokenDescriptorProxy.waitForDeployment();
	console.log("TransparentUpgradeableProxy deployed to:", await nonfungibleTokenDescriptorProxy.getAddress());

	const nonfungiblePositionManager = await deploy("NonfungiblePositionManager", {
		from: deployer,
		log: true,
		args: [v3CoreFactoryAddress, WETH9Address, await nonfungibleTokenDescriptorProxy.getAddress(), gasAdmin],
	});

	const v3Migrator = await deploy("V3Migrator", {
		from: deployer,
		log: true,
		args: [v3CoreFactoryAddress, WETH9Address, nonfungiblePositionManager.address],
	});

	const quoterV2 = await deploy("QuoterV2", {
		from: deployer,
		log: true,
		args: [v3CoreFactoryAddress, WETH9Address],
	});

	const swapRouter = await deploy("SwapRouter", {
		from: deployer,
		log: true,
		args: [v3CoreFactoryAddress, WETH9Address, gasAdmin],
	});
};

module.exports.tags = ['Periphery'];
