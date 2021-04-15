// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.16;

import "./Token.sol";

contract EthSwap {
    string public name = "EthSwap Instant Exchange";
    Token public token;
    uint256 public rate = 100;

    event TokensPurchased(
        address account,
        address token,
        uint256 amount,
        uint256 rate
    );

    event TokensSold(
        address account,
        address token,
        uint256 amount,
        uint256 rate
    );

    constructor(Token _token) public {
        token = _token;
    }

    function buyTokens() public payable {
        uint256 tokenAmount = msg.value * rate;

        require(token.balanceOf(address(this)) >= tokenAmount);

        token.transfer(msg.sender, tokenAmount);

        emit TokensPurchased(msg.sender, address(token), tokenAmount, rate);
    }

    function sellTokens(uint256 amount) public {
        require(token.balanceOf(msg.sender) >= amount);

        uint256 etherAmount = amount / rate;

        require(address(this).balance >= etherAmount);

        token.transferFrom(msg.sender, address(this), amount);
        msg.sender.transfer(etherAmount);

        emit TokensSold(msg.sender, address(token), amount, rate);
    }
}
