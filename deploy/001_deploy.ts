import { getNamedAccounts, deployments } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { asciiStringToBytes32 } from './utils/utils';
import ProxyAdmin from '@openzeppelin/contracts/build/contracts/ProxyAdmin.json'
import TransparentProxy from '@openzeppelin/contracts/build/contracts/TransparentUpgradeableProxy.json';

const WETH9Address = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const nativeCurrencySymbol = "ETH";
const v3CoreFactoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

module.exports = async (hre: HardhatRuntimeEnvironment) => {
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();
	const [deployerSigner] = await hre.ethers.getSigners();

	const multicall = await deploy("UniswapInterfaceMulticall", {
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
		args: [v3CoreFactoryAddress, WETH9Address, await nonfungibleTokenDescriptorProxy.getAddress()],
	});

	const quoterV2 = await deploy("QuoterV2", {
		from: deployer,
		log: true,
		args: [v3CoreFactoryAddress, WETH9Address],
	});

	const swapRouter = await deploy("SwapRouter", {
		from: deployer,
		log: true,
		args: [v3CoreFactoryAddress, WETH9Address],
	});
};

module.exports.tags = ['Periphery'];
