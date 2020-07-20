// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

interface IExchange {

    function claimTetherToken(address _to, address _token) external returns (bool);
 
}
