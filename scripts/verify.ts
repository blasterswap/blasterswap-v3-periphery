import fs from 'fs-extra';
import hre from 'hardhat';
import { join } from 'path';

async function verify(params: object) {
	await hre.run('verify:verify', params);
}

async function main(): Promise<void> {
	const network = hre.network.name;

	const deploymentPath = join(__dirname, `../deployments/${network}`);

	const positionManager = await fs.readJson(join(deploymentPath, 'NonfungiblePositionManager.json'));
	const swapRouter = await fs.readJson(join(deploymentPath, 'SwapRouter.json'));
	const v3Migrator = await fs.readJson(join(deploymentPath, 'V3Migrator.json'));
	const v3ToV3Migrator = await fs.readJson(join(deploymentPath, 'V3ToV3Migrator.json'));
	const quoterV2 = await fs.readJson(join(deploymentPath, 'QuoterV2.json'));
	const tickLens = await fs.readJson(join(deploymentPath, 'TickLens.json'));
	const NFTDescriptor = await fs.readJson(join(deploymentPath, 'NFTDescriptor.json'));
	const nonfungibleTokenPositionDescriptor = await fs.readJson(join(deploymentPath, 'NonfungibleTokenPositionDescriptor.json'));

	console.log('Verifying positionManager...');
	await verify({
		address: positionManager.address,
		constructorArguments: positionManager.args,
	});

	console.log('Verifying swapRouter...');
	await verify({
		address: swapRouter.address,
		constructorArguments: swapRouter.args,
	});

	console.log('Verifying V3Migrator...');
	await verify({
		address: v3Migrator.address,
		constructorArguments: v3Migrator.args,
	});

	console.log('Verifying V3ToV3Migrator...');
	await verify({
		address: v3ToV3Migrator.address,
		constructorArguments: v3ToV3Migrator.args,
	});

	console.log('Verifying quoterV2...');
	await verify({
		address: quoterV2.address,
		constructorArguments: quoterV2.args,
	});

	console.log('Verifying tickLens...');
	await verify({
		address: tickLens.address,
		constructorArguments: tickLens.args,
	});

	console.log('Verifying NftDescriptor...');
	await verify({
		address: NFTDescriptor.address,
		constructorArguments: NFTDescriptor.args,
	});

	console.log('Verifying NonfungibleTokenPositionDescriptor...');
	await verify({
		address: nonfungibleTokenPositionDescriptor.address,
		constructorArguments: nonfungibleTokenPositionDescriptor.args,
		libraries: {
			NFTDescriptor: NFTDescriptor.address
		}
	});
}

main()
	.then(() => process.exit(0))
	.catch((error: Error) => {
		console.error(error);
		process.exit(1);
	});
