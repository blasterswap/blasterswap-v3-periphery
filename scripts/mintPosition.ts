import hre, { ethers } from 'hardhat';

const factoryAbi = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "token0",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "token1",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "uint24",
				"name": "fee",
				"type": "uint24"
			},
			{
				"indexed": false,
				"internalType": "int24",
				"name": "tickSpacing",
				"type": "int24"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "pool",
				"type": "address"
			}
		],
		"name": "PoolCreated",
		"type": "event"
	}
];

const npmAddress = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";

const erc20MockAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const wethAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

async function main() {
	const npm = await hre.ethers.getContractAt("NonfungiblePositionManager", npmAddress)

	const erc20Mock = await hre.ethers.getContractAt("ERC20Mock", erc20MockAddress)
	const weth = await hre.ethers.getContractAt("ERC20Mock", wethAddress)

	const erc20MockAmount = hre.ethers.parseEther("0.1");
	const ethAmount = hre.ethers.parseEther("0.1");

	const [minter] = await hre.ethers.getSigners();
	console.log(`Minter address: ${minter.address}`);

	await minter.sendTransaction({
		to: wethAddress,
		value: ethAmount
	})

	await erc20Mock.approve(npmAddress, erc20MockAmount);
	await weth.approve(npmAddress, ethAmount);

	// balance of mock and weth
	const balance = await erc20Mock.balanceOf(minter.address);
	const wethBalance = await weth.balanceOf(minter.address);

	console.log("ERC20 balance: ", balance.toString());
	console.log("WETH balance: ", wethBalance.toString());


	const [token0, token1] = BigInt(erc20MockAddress) > BigInt(wethAddress)
		? [wethAddress, erc20MockAddress]
		: [erc20MockAddress, wethAddress];

	const fee = 3000;
	const minTick = -887220;
	const maxTick = -minTick;
	const amount0Desired = erc20MockAmount;
	const amount1Desired = ethAmount;
	const amount0Min = 0;
	const amount1Min = 0;
	const recipient = minter.address;
	const deadline = Date.now() + 1000;
	const sqrtPriceX96 = BigInt(100) * (BigInt(2) ** BigInt(96));

	const factoryAddress = await npm.factory();

	const factory = await hre.ethers.getContractAt(factoryAbi, factoryAddress);
	const filterPoolCreated = factory.filters.PoolCreated;


	console.log(BigInt(token0) < BigInt(token1));
	console.log(`Creating position...`)
	await npm.createAndInitializePoolIfNecessary(token0, token1, fee, sqrtPriceX96);
	const poolCreatedEvent = await factory.queryFilter(filterPoolCreated, 0, "latest");

	const poolAddress = poolCreatedEvent[0].args[4];
	console.log(`Pool created: ${poolAddress}`);

	// // 0x0e943bA5eCa9eaF2E5872A9E7E52A32713300372

	const mintParams = {
		token0: token0,
		token1: token1,
		fee: fee,
		tickLower: minTick,
		tickUpper: maxTick,
		amount0Desired: amount0Desired,
		amount1Desired: amount1Desired,
		amount0Min: amount0Min,
		amount1Min: amount1Min,
		recipient: recipient,
		deadline: deadline
	};

	console.log(mintParams);
	await npm.mint(mintParams);

	const filterIncreaseLiquidity = npm.filters.IncreaseLiquidity;
	const increaseLiquidityEvent = await npm.queryFilter(filterIncreaseLiquidity, 0, "latest");

	console.log(increaseLiquidityEvent[0]);




}

main();
