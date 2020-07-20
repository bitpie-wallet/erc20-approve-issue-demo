// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IExchange.sol";

interface TetherERC20Basic {
    function totalSupply() external view returns (uint);
    function balanceOf(address who) external view returns (uint);
    function transfer(address to, uint value) external;
    event Transfer(address indexed from, address indexed to, uint value);
}

interface TetherERC20 is TetherERC20Basic {
    function allowance(address owner, address spender) external view returns (uint);
    function transferFrom(address from, address to, uint value) external;
    function approve(address spender, uint value) external;
    event Approval(address indexed owner, address indexed spender, uint value);
}

contract ExchangeDemo is IExchange, Ownable {

    address public upgradedAddress;
    bool public deprecated;

    constructor()
        public
    {
    }

    function transfer (
        address from,
        address to,
        address token,
        uint256 amount
    )
        public  // here should be an internal call
        returns (bool)
    {
        TetherERC20 token = TetherERC20(token);
        token.transferFrom(from, to, amount);

       return true;
    }
    
    function claimTetherToken(
        address _to,
        address _token
    ) 
        public
        onlyOwner
        override
        returns (bool)
    {
        if (deprecated) {
            return IExchange(upgradedAddress).claimTetherToken(_to, _token);
        } else {
            TetherERC20 tetherToken = TetherERC20(_token);
            uint256 balance = tetherToken.balanceOf(address(this));
            tetherToken.transfer(_to, balance);
        }

        return true;
    }

    function upgrade(
        address _upgradedAddress
    )
        public
        onlyOwner
        returns (bool)
    {
        deprecated = true;
        upgradedAddress = _upgradedAddress;

        return true;
    }
}
