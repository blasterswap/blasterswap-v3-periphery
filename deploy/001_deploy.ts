import { getNamedAccounts, deployments } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { asciiStringToBytes32 } from './utils/utils';
import ProxyAdmin from '@openzeppelin/contracts/build/contracts/ProxyAdmin.json'
import TransparentProxy from '@openzeppelin/contracts/build/contracts/TransparentUpgradeableProxy.json';
import ethers from 'ethers';

const WETH9Address = "0x4300000000000000000000000000000000000004";
const nativeCurrencySymbol = "ETH";
const v3CoreFactoryAddress = "0xb7a92633Bc7074c8216Dc53566fD58A77b5D32D9";
const v3ThrusterPositionManagerAddress = "0x434575eaea081b735c985fa9bf63cd7b87e227f9";
const v2FactoryAddress = "0x9CC1599D4378Ea41d444642D18AA9Be44f709ffD";
const gasAdmin = "0xba99b8a284f45447929a143dc2efa5bcfe7ade60";

module.exports = async (hre: HardhatRuntimeEnvironment) => {
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();
	const [deployerSigner] = await hre.ethers.getSigners();

	console.log(`deploying with: ${deployer}`);

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
		args: [WETH9Address, asciiStringToBytes32(nativeCurrencySymbol), gasAdmin],
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
		args: [v3CoreFactoryAddress, WETH9Address, await nonfungibleTokenDescriptorProxy.getAddress(), deployer],
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


	const v3Migrator = await deploy("V3Migrator", {
		from: deployer,
		log: true,
		args: [v2FactoryAddress, WETH9Address, nonfungiblePositionManager.address],
	});

	const v3ToV3Migrator = await deploy("V3ToV3Migrator", {
		from: deployer,
		log: true,
		args: [v3ThrusterPositionManagerAddress, nonfungiblePositionManager.address],
	});

};

module.exports.tags = ['Periphery'];
