const { assert } = require("chai");
const { default: Web3 } = require("web3");

const Token = artifacts.require("Token");
const EthSwap = artifacts.require("EthSwap");

require("chai").use(require("chai-as-promised")).should();

function tokens(n) {
  return web3.utils.toWei(n, "ether");
}

contract("EthSwap", ([deployer, investor]) => {
  let token, ethSwap;
  before(async () => {
    token = await Token.new();
    ethSwap = await EthSwap.new(token.address);
    await token.transfer(ethSwap.address, tokens("1000000"));
  });

  describe("Token deployment", async () => {
    it("contract has a name", async () => {
      const name = await token.name();
      assert.equal(name, "Flav Token");
    });
  });

  describe("EthSwap deployment", async () => {
    it("contract has a name", async () => {
      const name = await ethSwap.name();
      assert.equal(name, "EthSwap Instant Exchange");
    });

    it("contract has token", async () => {
      let balance = await token.balanceOf(ethSwap.address);
      assert.equal(balance.toString(), tokens("1000000"));
    });
  });

  describe("buyTokens()", async () => {
    let result;
    before(async () => {
      result = await ethSwap.buyTokens({ from: investor, value: tokens("1") });
    });
    it("Allows user to instantly purchase Flav tokens", async () => {
      let insvestorBalance = await token.balanceOf(investor);
      assert.equal(insvestorBalance.toString(), tokens("100"));

      let ethSwapBalance = await token.balanceOf(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), tokens("999900"));

      let ethSwapBalance2 = await web3.eth.getBalance(ethSwap.address);
      assert.equal(ethSwapBalance2.toString(), web3.utils.toWei("1", "Ether"));

      const event = result.logs[0].args;
      assert.equal(event.account, investor);
      assert.equal(event.token, token.address);
      assert.equal(event.amount.toString(), tokens("100"));
      assert.equal(event.rate.toString(), "100");
    });
  });

  describe("sellTokens()", async () => {
    let result;
    before(async () => {
      await token.approve(ethSwap.address, tokens("100"), { from: investor });

      result = await ethSwap.sellTokens(tokens("100"), { from: investor });
    });
    it("Allows user to instantly sell tokens to EthSwap", async () => {
      let insvestorBalance = await token.balanceOf(investor);
      assert.equal(insvestorBalance.toString(), tokens("0"));

      let ethSwapBalance = await token.balanceOf(ethSwap.address);
      assert.equal(ethSwapBalance.toString(), tokens("1000000"));

      let ethSwapBalance2 = await web3.eth.getBalance(ethSwap.address);
      assert.equal(ethSwapBalance2.toString(), web3.utils.toWei("0", "Ether"));

      const event = result.logs[0].args;
      assert.equal(event.account, investor);
      assert.equal(event.token, token.address);
      assert.equal(event.amount.toString(), tokens("100"));
      assert.equal(event.rate.toString(), "100");

      await ethSwap.sellTokens(tokens("500"), { from: investor }).should.be
        .rejected;
    });
  });
});
