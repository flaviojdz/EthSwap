import React, { Component } from "react";
import Web3 from "web3";
import "./App.css";
import EthSwap from "../abis/EthSwap.json";
import Navbar from "./Navbar";
import Main from "./Main";
import Token from "../abis/Token.json";

class App extends Component {
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockChainData();
  }

  async loadBlockChainData() {
    const web3 = window.web3;

    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });

    const ethBalance = await web3.eth.getBalance(this.state.account);
    this.setState({ ethBalance });

    const networkId = await web3.eth.net.getId();
    const tokenData = Token.networks[networkId];

    if (!tokenData) {
      window.alert("Token contract not deployed to detected network");
      return;
    }

    const token = new web3.eth.Contract(Token.abi, tokenData.address);
    this.setState({ token });
    let tokenBalance = await token.methods.balanceOf(this.state.account).call();
    this.setState({ tokenBalance: tokenBalance.toString() });

    const ethSwapData = EthSwap.networks[networkId];

    if (!ethSwapData) {
      window.alert("ethSwap contract not deployed to detected network");
      return;
    }

    const ethSwap = new web3.eth.Contract(EthSwap.abi, ethSwapData.address);
    this.setState({ ethSwap });

    this.setState({ loading: false });
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
      await window.ethereum.enable();
    } else {
      window.alert("Non-Etherum browser detected. Get MetaMask!!!");
    }
  }

  buyTokens = (etherAmount) => {
    this.setState({ loading: true });
    this.state.ethSwap.methods
      .buyTokens()
      .send({ value: etherAmount, from: this.state.account })
      .on("transactionHash", (hash) => {
        this.setState({ loading: false });
      });
  };

  sellTokens = (tokenAmount) => {
    console.log(this.state.ethSwap);
    this.setState({ loading: true });
    this.state.token.methods
      .approve(this.state.ethSwap._address, tokenAmount)
      .send({ from: this.state.account })
      .on("transactionHash", (hash) => {
        this.state.ethSwap.methods
          .sellTokens(tokenAmount)
          .send({ from: this.state.account })
          .on("transactionHash", (hash) => {
            this.setState({ loading: false });
          });
      });
  };

  constructor(props) {
    super(props);
    this.state = {
      account: "",
      ethBalance: 0,
      ethSwap: {},
      tokenBalance: 0,
      token: {},
      loading: true,
    };
  }

  render() {
    let content;
    if (this.state.loading) {
      content = (
        <p id="loader" className="text-center">
          Loading...:)
        </p>
      );
    } else {
      content = (
        <Main
          ethBalance={this.state.ethBalance}
          tokenBalance={this.state.tokenBalance}
          buyTokens={this.buyTokens}
          sellTokens={this.sellTokens}
        />
      );
    }

    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main
              role="main"
              className="col-lg-12 mr-auto ml-auto"
              style={{ maxWidth: "600px" }}
            >
              <div className="content mr-auto ml-auto">
                <a
                  href="https://github.com/flaviojdz"
                  target="_blank"
                  rel="noopener noreferrer"
                ></a>

                {content}
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
