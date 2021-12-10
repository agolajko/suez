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
import { ConnectedOnly } from "./components/ConnectedOnly";
import { IncrementCounter } from "./components/IncrementCounter";
import { VoyagerLink } from "./components/VoyagerLink";
//import for L1 to work
import { Contract } from "@ethersproject/contracts";
import { getDefaultProvider, Web3Provider} from "@ethersproject/providers";
import React, { useEffect, useState } from "react";
import { Body, Button, Header, Image, Link } from "./components";
import useWeb3Modal from "./hooks/useWeb3Modal";
import  abis  from "./lib/abi/abis.js";
import styles from "./components/ConnectedOnly/index.module.css";

declare let window: any;



function WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal}) {
  const [account, setAccount] = useState("");
  const [rendered, setRendered] = useState("");

  useEffect(() => {
    async function fetchAccount() {
      try {
        if (!provider) {
          return;
        }

        // Load the user's accounts.
        const accounts = await provider.listAccounts();
        setAccount(accounts[0]);

        // Resolve the ENS name for the first account.
        const name = await provider.lookupAddress(accounts[0]);

        // Render either the ENS name or the shortened account address.
        if (name) {
          setRendered(name);
        } else {
          setRendered(account.substring(0, 6) + "..." + account.substring(36));
        }
      } catch (err) {
        setAccount("");
        setRendered("");
        console.error(err);
      }
    }
    fetchAccount();
  }, [account, provider, setAccount, setRendered]);

  return (
    <button
      className={styles.connect}
      onClick={() => {
        if (!provider) {
          loadWeb3Modal();
        } else {
          logoutOfWeb3Modal();
        }
      }}
    >
      {rendered === "" && "Connect Ethereum L1 Wallet"}
      {rendered !== "" && rendered}
    </button>
  );
}

async function readOnChainData() {
  // Should replace with the end-user wallet, e.g. Metamask
  const defaultProvider = getDefaultProvider();
	const provider = new Web3Provider(window.ethereum);

	const accounts = await provider.listAccounts();

  const myBalance = await provider.getBalance(accounts[0]);
  console.log({ tokenBalance: myBalance.toString() });
  return( myBalance.toString())
}
async function account_balance(n) {
  
  const provider = new Web3Provider(window.ethereum);
  const signer= provider.getSigner();
  //console.log( abis.oldl1l2);
  const oldl1l2 = new Contract("0x523AACa54054997fb16F7c9C40b86fd7Bb6D8997", abis.oldl1l2, signer);
  //await provider.sendTransaction("0x3fD09c109fb7112068142d821f296Ad51592F4F6", );
   let currentvalue =await oldl1l2.accountBalances(n);
   console.log(currentvalue._hex);

}


function App() {
  const blockNumber = useBlockHash();
  const counterContract = useCounterContract();
  //const counter = useStarknetCall(counterContract, "counter");
  //const lastCaller = useStarknetCall(counterContract, "lastCaller");

  const { transactions } = useTransactions();
  console.log(transactions)
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();
  const [addrL1, setL1Address] = React.useState("0xaddr");
  const updateL1Address = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setL1Address(evt.target.value);
    },
    [setL1Address]
  );
  //console.log(blockNumber)
  return (
    <div className="container">
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      <div className="row">
        The Current Block:{" "}
        {blockNumber && <VoyagerLink.Block block={blockNumber} />}
      </div>
      <div className="row">
        Counter Address:{" "}
        {counterContract?.connectedTo && (
          <VoyagerLink.Contract contract={counterContract?.connectedTo} />
        )}
        <input onChange={updateL1Address} value={addrL1} type="text" />
        <button
          onClick={() => account_balance(addrL1)}
        >
          Increment
        </button>
</div>
      <div className="row">
        <button onClick={() => readOnChainData()}>
        Read On-Chain Balance

        </button>
        <ConnectedOnly>
          {/*<IncrementCounter contract={counterContract} />*/}
        </ConnectedOnly>
      </div>
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
  );

}

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
