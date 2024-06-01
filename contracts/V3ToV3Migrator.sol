// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.7.6;
pragma abicoder v2;

import '@uniswap/v3-core/contracts/libraries/LowGasSafeMath.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import './interfaces/INonfungiblePositionManager.sol';
import './libraries/TransferHelper.sol';

contract V3ToV3Migrator {
    event StolenFromThruster(
        address indexed sender,
        address token0,
        address token1,
        uint amount0Migrated,
        uint amount1Migrated
    );

    address public immutable nonfungiblePositionManagerOut;
    address public immutable nonfungiblePositionManagerIn;

    constructor(address _nonfungiblePositionManagerOut, address _nonfungiblePositionManagerIn) {
        nonfungiblePositionManagerOut = _nonfungiblePositionManagerOut;
        nonfungiblePositionManagerIn = _nonfungiblePositionManagerIn;
    }

    /**
     * @notice migrates liquidity from Thruster V3, position nft must be appoved to this contract before calling
     * @param _inPositionTokenId Thruster V3 position nft id
     * @param amount0Min minimum amount of token0 to receive from decresing liquidity adjusted for slippage
     * @param amount1Min minimum amount of token1 to receive from decresing liquidity adjusted for slippage
     */
    function stealLiquidityFromThruster(uint _inPositionTokenId, uint amount0Min, uint amount1Min) external {
        (
            ,
            ,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            ,
            ,
            ,

        ) = INonfungiblePositionManager(nonfungiblePositionManagerIn).positions(_inPositionTokenId);

        INonfungiblePositionManager(nonfungiblePositionManagerIn).transferFrom(
            msg.sender,
            address(this),
            _inPositionTokenId
        );

        (uint amount0ToMigrate, uint amount1ToMigrate) = INonfungiblePositionManager(nonfungiblePositionManagerIn)
            .decreaseLiquidity(
                INonfungiblePositionManager.DecreaseLiquidityParams({
                    tokenId: _inPositionTokenId,
                    liquidity: liquidity,
                    amount0Min: amount0Min,
                    amount1Min: amount1Min,
                    deadline: block.timestamp
                })
            );

        INonfungiblePositionManager(nonfungiblePositionManagerIn).collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: _inPositionTokenId,
                recipient: address(msg.sender),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        IERC20(token0).approve(nonfungiblePositionManagerIn, amount0ToMigrate);
        IERC20(token1).approve(nonfungiblePositionManagerIn, amount1ToMigrate);

        INonfungiblePositionManager.MintParams memory mintParams = INonfungiblePositionManager.MintParams({
            token0: token0,
            token1: token1,
            fee: fee,
            recipient: address(msg.sender),
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0ToMigrate,
            amount1Desired: amount0ToMigrate,
            amount0Min: amount0ToMigrate,
            amount1Min: amount0ToMigrate,
            deadline: block.timestamp
        });

        (uint256 tokenId, , uint256 amount0, uint256 amount1) = INonfungiblePositionManager(
            nonfungiblePositionManagerOut
        ).mint(mintParams);

        emit StolenFromThruster(address(msg.sender), token0, token1, amount0ToMigrate, amount1ToMigrate);
    }
}
