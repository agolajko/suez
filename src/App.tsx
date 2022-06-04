//import React from "react";
import "./App.css";
import { useCounterContract } from "./lib/counter";
import { useStarknetCall } from "./lib/hooks";
import {
  BlockHashProvider,
  useBlockHash,
} from "./providers/BlockHashProvider";
import { StarknetProvider } from "./providers/StarknetProvider";
import {
  TransactionsProvider,
  useTransactions,
} from "./providers/TransactionsProvider";

import { useStarknetInvoke } from "./lib/hooks";
import { useStarknet } from "./providers/StarknetProvider";
import { useTransaction } from "./providers/TransactionsProvider";
import { Contract as StarkwareContract } from "starknet";

import { ConnectedOnly } from "./components/ConnectedOnly";
import { GetBalance } from "./components/getBalance";
import { Transfer } from "./components/Transfer";
import { WithdrawL2 } from "./components/WithdrawL2";
import { VoyagerLink } from "./components/VoyagerLink";
import { DepositL1 } from "./components/DepositL1";
import { ConnectL1WalletButton } from "./components/ConnectL1Wallett";
//import for L1 to work
import { Contract } from "@ethersproject/contracts";
//import utils from "@ethersproject/utils";
import { getDefaultProvider, Web3Provider } from "@ethersproject/providers";
import React, { useEffect, useState } from "react";
import { Body, Button, Header, Image, Link } from "./components";
import useWeb3Modal from "./hooks/useWeb3Modal";
import abis from "./lib/abi/abis.js";
import Big from "big.js";
import { ethAddress } from "./addresses"

declare let window: any;



///////////////////////////////////////////////////////////////
//function WithdrawL2({ contract}: { contract?: StarkwareContract} ) {

////////////////////////////////////////


function App() {
  const blockNumber = useBlockHash();
  const counterContract = useCounterContract();

  const { transactions } = useTransactions();
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();
  const [addrL1, setL1Address] = React.useState("0xadd");
  const updateL1Address = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setL1Address(evt.target.value);
    },
    [setL1Address]
  );

  return (
    <div className="container">

      {/* <div className="row">
      
        <ConnectL1WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      &nbsp; <a href="https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn"><img src="/metamaskdownload.png" width="200"/></a>
      </div> */}

      <ConnectedOnly>
      </ConnectedOnly>
      &nbsp; <a href="https://chrome.google.com/webstore/detail/argent-x-starknet-wallet/dlcobpjiigpikoobohmabehhmhfoodbb"><img src="/argentx-button-download.svg" width="200" /></a>


      <GetBalance contract={counterContract} />



      <h1>Deposit to Starknet</h1>
      <p> Only works with Goerli. Full Ethereum Mainnet support coming soon.<br></br> Until then any real Eth sent will be lost! </p>

      <div className="row" title="Use this to deposit ether directly to L2. Input your L2 account address, and the amount in eth that you want to deposit.">

        <DepositL1 provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      </div>

      <h1>Transfer within Starknet</h1>

      <Transfer contract={counterContract} />
      <h1>Withdraw from Starknet</h1>
      <p className="starknetexplain"> Withdrawal from Starknet back to your Ethereum wallet consists of 3 steps:</p>
      <ol className="starknetexplain">
        <li>  Press to Withdraw your balance from Starknet to the bridge</li>
        <li> Wait 25 minutes ⏰ to cross the bridge</li>
        <li> Move the money to your Ethereum wallet from the bridge </li>
      </ol>

      <div className="row" >

        <WithdrawL2 contract={counterContract} />
      </div>



      <div>
        <div className="row">
          <p>Transactions:</p>
          <ul>
            {transactions.map((tx, idx) => (
              <li key={idx}>
                <VoyagerLink.Transaction transactionHash={tx.hash} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rowgrey">
        Starknet Cairo Contract Address:{" "}
        {counterContract?.connectedTo && (
          <VoyagerLink.Contract contract={counterContract?.connectedTo} />
        )}
      </div>
      <div className="rowgrey">
        Ethereum Solidity Contract Address:{" "}
        <VoyagerLink.L1Contract contract={ethAddress} />
      </div>
    </div>
  );
};

function AppWithProviders() {
  return (
    <StarknetProvider>
      <BlockHashProvider>
        <TransactionsProvider>
          <App />

        </TransactionsProvider>
      </BlockHashProvider>
    </StarknetProvider>
  );
}
export default AppWithProviders;
