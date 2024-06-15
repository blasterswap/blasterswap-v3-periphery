import { abi as IUniswapV3PoolABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { Fixture } from 'ethereum-waffle'
import { BigNumberish, constants, Wallet } from 'ethers'
import { ethers, waffle } from 'hardhat'
import {
	IUniswapV3Factory,
	IWETH9,
	MockTimeNonfungiblePositionManager,
	NonfungiblePositionManagerPositionsGasTest,
	SwapRouter,
	TestERC20,
	TestPositionNFTOwner,
	V3ToV3Migrator,
} from '../typechain'
import completeFixture from './shared/completeFixture'
import { computePoolAddress } from './shared/computePoolAddress'
import { FeeAmount, MaxUint128, TICK_SPACINGS } from './shared/constants'
import { encodePriceSqrt } from './shared/encodePriceSqrt'
import { expandTo18Decimals } from './shared/expandTo18Decimals'
import { expect } from './shared/expect'
import { extractJSONFromURI } from './shared/extractJSONFromURI'
import getPermitNFTSignature from './shared/getPermitNFTSignature'
import { encodePath } from './shared/path'
import poolAtAddress from './shared/poolAtAddress'
import snapshotGasCost from './shared/snapshotGasCost'
import { getMaxTick, getMinTick } from './shared/ticks'
import { sortedTokens } from './shared/tokenSort'

describe('NonfungiblePositionManager', () => {
	let wallets: Wallet[]
	let wallet: Wallet, other: Wallet

	const nftFixture: Fixture<{
		nft: MockTimeNonfungiblePositionManager
		nftBlaster: MockTimeNonfungiblePositionManager
		factory: IUniswapV3Factory
		tokens: [TestERC20, TestERC20, TestERC20]
		weth9: IWETH9
		router: SwapRouter
		v3ToV3Migrator: V3ToV3Migrator
	}> = async (wallets, provider) => {
		const { weth9, factory, tokens, nft, router, nftBlaster } = await completeFixture(wallets, provider)

		// approve & fund wallets
		for (const token of tokens) {
			await token.approve(nft.address, constants.MaxUint256)
			await token.connect(other).approve(nft.address, constants.MaxUint256)
			await token.transfer(other.address, expandTo18Decimals(1_000_000))
		}

		const V3ToV3Migrator = await ethers.getContractFactory('V3ToV3Migrator');
		const v3ToV3Migrator = (await V3ToV3Migrator.deploy(nftBlaster.address, nft.address)) as V3ToV3Migrator;

		return {
			nft,
			nftBlaster,
			factory,
			tokens,
			weth9,
			router,
			v3ToV3Migrator
		}
	}

	let v3ToV3Migrator: V3ToV3Migrator;
	let factory: IUniswapV3Factory
	let nft: MockTimeNonfungiblePositionManager
	let nftBlaster: MockTimeNonfungiblePositionManager
	let tokens: [TestERC20, TestERC20, TestERC20]
	let weth9: IWETH9
	let router: SwapRouter

	let loadFixture: ReturnType<typeof waffle.createFixtureLoader>

	before('create fixture loader', async () => {
		wallets = await (ethers as any).getSigners()
			;[wallet, other] = wallets

		loadFixture = waffle.createFixtureLoader(wallets)
	})

	beforeEach('load fixture', async () => {
		({ nft, nftBlaster, factory, tokens, weth9, router, v3ToV3Migrator } = await loadFixture(nftFixture))
	})

	it('bytecode size', async () => {
		expect(((await nft.provider.getCode(nft.address)).length - 2) / 2).to.matchSnapshot()
	})

	describe('mint on nft and migrate to nftBlaster', () => {
		it('creates a token', async () => {
			await nft.createAndInitializePoolIfNecessary(
				tokens[0].address,
				tokens[1].address,
				FeeAmount.MEDIUM,
				encodePriceSqrt(1, 1)
			)

			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				fee: FeeAmount.MEDIUM,
				recipient: other.address,
				amount0Desired: 15,
				amount1Desired: 15,
				amount0Min: 0,
				amount1Min: 0,
				deadline: 10,
			})
			expect(await nft.balanceOf(other.address)).to.eq(1)
			expect(await nft.tokenOfOwnerByIndex(other.address, 0)).to.eq(1)
			const {
				fee,
				token0,
				token1,
				tickLower,
				tickUpper,
				liquidity,
				tokensOwed0,
				tokensOwed1,
				feeGrowthInside0LastX128,
				feeGrowthInside1LastX128,
			} = await nft.positions(1)
			expect(token0).to.eq(tokens[0].address)
			expect(token1).to.eq(tokens[1].address)
			expect(fee).to.eq(FeeAmount.MEDIUM)
			expect(tickLower).to.eq(getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]))
			expect(tickUpper).to.eq(getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]))
			expect(liquidity).to.eq(15)
			expect(tokensOwed0).to.eq(0)
			expect(tokensOwed1).to.eq(0)
			expect(feeGrowthInside0LastX128).to.eq(0)
			expect(feeGrowthInside1LastX128).to.eq(0)

			await nftBlaster.createAndInitializePoolIfNecessary(
				tokens[0].address,
				tokens[1].address,
				FeeAmount.MEDIUM,
				encodePriceSqrt(1, 1)
			)

			await nft.connect(other).approve(v3ToV3Migrator.address, 1);
			await v3ToV3Migrator.connect(other).migrateLiquidityToBlaster(1, 2, 2);
		})
	})
})
