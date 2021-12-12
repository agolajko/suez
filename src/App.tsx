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
//import utils from "@ethersproject/utils";
import { getDefaultProvider, Web3Provider} from "@ethersproject/providers";
import React, { useEffect, useState } from "react";
import { Body, Button, Header, Image, Link } from "./components";
import useWeb3Modal from "./hooks/useWeb3Modal";
import  abis  from "./lib/abi/abis.js";
import styles from "./components/ConnectedOnly/index.module.css";

declare let window: any;



function ConnectL1WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal}) {
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

function ReadL1Balance({ provider, loadWeb3Modal, logoutOfWeb3Modal}) {
  const [account, setAccount] = useState("");
  const [rendered, setRendered] = useState("");
  const [l1Address, setL1Address] = React.useState("l1Address");
  const updateL1Address = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setL1Address(evt.target.value);
    },
    [setL1Address]
  );
//What we want here, is an input that updates, that is done with updateL1Address and React.Callback. We also need a button, that when pushed, returns the ReadL1BalanceInner. There is no need for useEffect, it seems to me. 
  
    async function fetchAmount(l1Address) {
      let currentValue=await ReadL1BalanceInner(l1Address);
      console.log(typeof(currentValue));
      
      let stringCurrentValue=(currentValue).toString();
      console.log((stringCurrentValue));
      setRendered("   "+stringCurrentValue);
    };
    
    
    

  return( <div className="row">
        <input onChange={updateL1Address} value={l1Address} type="text" />
        <button
          onClick={() => fetchAmount(l1Address)}
        >
         Account balance 
        </button>
        {rendered === "" && " No transactions yet"}
      {rendered !== "" && rendered}
      </div>);
}

async function ReadL1BalanceInner(address) {
  
  const provider = new Web3Provider(window.ethereum);
  const signer= provider.getSigner();
  //console.log( abis.oldl1l2);
  const oldl1l2 = new Contract("0x523AACa54054997fb16F7c9C40b86fd7Bb6D8997", abis.oldl1l2, signer);
  //await provider.sendTransaction("0x3fD09c109fb7112068142d821f296Ad51592F4F6", );
   let currentReturn =await oldl1l2.accountBalances(address);
   console.log(typeof(currentReturn._hex));
   let currentvalue=String(currentReturn._hex);
  return(currentvalue)
}


function DepositL1({ provider, loadWeb3Modal, logoutOfWeb3Modal}) {
  
  const [rendered, setRendered] = useState("");
  
  const [depositAmount, setDepositAmount] = React.useState("depositAmount");
  const [l2ContractAddress, setL2ContractAddress] = React.useState("l2ContractAddress");
  const [l2UserAddress, setL2UserAddress] = React.useState("l2UserAddress");
  const updateL2UserAddress = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setL2UserAddress(evt.target.value);
    },
    [setL2UserAddress]
  );
  const updateL2ContractAddress = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setL2ContractAddress(evt.target.value);
    },
    [setL2ContractAddress]
  );
  const updateDepositAmount = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setDepositAmount(evt.target.value);
    },
    [setDepositAmount]
  );
  
    async function sendDeposit(l2ContractAddress, l2UserAddress, depositAmount) {
      let currentValue=await depositInner(l2ContractAddress, l2UserAddress, depositAmount);
      //console.log(typeof(currentValue));
      
      let stringCurrentValue=(currentValue).toString();
      //console.log((stringCurrentValue));
      setRendered("   "+stringCurrentValue);
    };
    
    
    
  

  return( <div className="row">
        <input onChange={updateL2ContractAddress} value={l2ContractAddress} type="text" />
         <input onChange={updateL2UserAddress} value={l2UserAddress} type="text" />
          <input onChange={updateDepositAmount} value={depositAmount} type="text" />
        <button
          onClick={() => sendDeposit(l2ContractAddress, l2UserAddress, depositAmount)}
        >
         Deposit L1 
        </button>
        {rendered === "" && "  No transactions yet"}
      {rendered !== "" && rendered}
      </div>);  
}

async function depositInner(l2ContractAddress, l2UserAddress, depositAmount) {
  
  const provider = new Web3Provider(window.ethereum);
  const signer= provider.getSigner();
  //console.log( abis.oldl1l2);
  const oldl1l2 = new Contract("0x523AACa54054997fb16F7c9C40b86fd7Bb6D8997", abis.oldl1l2, signer);
  //await provider.sendTransaction("0x3fD09c109fb7112068142d821f296Ad51592F4F6", );
  let overrides = {

    
    // The amount to send with the transaction (i.e. msg.value)
    value: depositAmount,//utils.parseEther(depositAmount),
  };
  
   let currentReturn =await oldl1l2.deposit(l2ContractAddress, l2UserAddress, overrides);//we have to specify amount here, and also above
   console.log(typeof(currentReturn._hex));
   let currentvalue=String(currentReturn._hex);
  return(currentvalue)
}


function WithdrawL2({ provider, loadWeb3Modal, logoutOfWeb3Modal}) {
  const [account, setAccount] = useState("");
  const [rendered, setRendered] = useState("");
  
  const [l2ContractAddress, setL2ContractAddress] = React.useState("l2ContractAddress");
  const [l2UserAddress, setL2UserAddress] = React.useState("l2UserAddress");
  const [l1UserAddress, setL1UserAddress] = React.useState("l1UserAddress");
  const [amount, setAmount] = React.useState("amount");
  
  const updateL1UserAddress = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setL1UserAddress(evt.target.value);
    },
    [setL1UserAddress]
  );
  const updateL2UserAddress = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setL2UserAddress(evt.target.value);
    },
    [setL2UserAddress]
  );
  const updateL2ContractAddress = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setL2ContractAddress(evt.target.value);
    },
    [setL2ContractAddress]
  );
  const updateAmount = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAmount(evt.target.value);
    },
    [setAmount]
  );
  
    
    async function sendWithdrawL2(l2ContractAddress, l2UserAddress, l1UserAddress, amount) {
      let currentValue=await WithdrawL2Inner(l2ContractAddress, l2UserAddress, l1UserAddress, amount);
      //console.log(typeof(currentValue));
      
      let stringCurrentValue=(currentValue).toString();
      //console.log((stringCurrentValue));
      setRendered("   "+stringCurrentValue);
    };
    
    
    
  return( <div className="row">
        <input onChange={updateL2ContractAddress} value={l2ContractAddress} type="text" />
        <input onChange={updateL2UserAddress} value={l2UserAddress} type="text" />
        <input onChange={updateL1UserAddress} value={l1UserAddress} type="text" />
        <input onChange={updateAmount} value={amount} type="text" />
        <button
          onClick={() => sendWithdrawL2(l2ContractAddress, l2UserAddress, l1UserAddress, amount)}
        >
         Withdraw L2 
        </button>
        {rendered === "" && " No transactions yet"}
      {rendered !== "" && rendered}
      </div>);
}

async function WithdrawL2Inner(l2ContractAddress, l2UserAddress, l1UserAddress, amount) {
  
  const provider = new Web3Provider(window.ethereum);
  const signer= provider.getSigner();
  //console.log( abis.oldl1l2);
  const oldl1l2 = new Contract("0x523AACa54054997fb16F7c9C40b86fd7Bb6D8997", abis.oldl1l2, signer);
  //await provider.sendTransaction("0x3fD09c109fb7112068142d821f296Ad51592F4F6", );
  
  
   let currentReturn =await oldl1l2.withdrawfroml2(l2ContractAddress, l2UserAddress, l1UserAddress, amount);//we have to specify amount here, and also above
   console.log(typeof(currentReturn._hex));
   let currentvalue=String(currentReturn._hex);
  return(currentvalue)
}



function WithdrawL1({ provider, loadWeb3Modal, logoutOfWeb3Modal}) {
  const [account, setAccount] = useState("");
  const [rendered, setRendered] = useState("");
  const [amount, setAmount] = React.useState("Amount");
  const updateAmount = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAmount(evt.target.value);
    },
    [setAmount]
  );

  
    async function sendWithdrawL1(amount) {
      let currentValue=await WithdrawL1Inner(amount);
      console.log(typeof(currentValue));
      
      let stringCurrentValue=(currentValue).toString();
      console.log((stringCurrentValue));
      setRendered("   "+stringCurrentValue);
    };
    
    
    

  return( <div className="row">
        <input onChange={updateAmount} value={amount} type="text" />
        <button
          onClick={() => sendWithdrawL1(amount)}
        >
         Withdraw L1
        </button>
        {rendered === "" && " No transaction Yet"}
      {rendered !== "" && rendered}
      </div>);


  
}

async function WithdrawL1Inner(amount) {
  
  const provider = new Web3Provider(window.ethereum);
  const signer= provider.getSigner();
  //console.log( abis.oldl1l2);
  const oldl1l2 = new Contract("0x523AACa54054997fb16F7c9C40b86fd7Bb6D8997", abis.oldl1l2, signer);
  //await provider.sendTransaction("0x3fD09c109fb7112068142d821f296Ad51592F4F6", );
  
  
   let currentReturn =await oldl1l2.withdrawfroml1(amount);//we have to specify amount here, and also above
   console.log(typeof(currentReturn._hex));
   let currentvalue=String(currentReturn._hex);
  return(currentvalue)
}

{/*
async function readOnChainData() {
  // Should replace with the end-user wallet, e.g. Metamask
  const defaultProvider = getDefaultProvider();
	const provider = new Web3Provider(window.ethereum);

	const accounts = await provider.listAccounts();

  const myBalance = await provider.getBalance(accounts[0]);
  console.log({ tokenBalance: myBalance.toString() });
  return( myBalance.toString())
}
*/}





function App() {
  const blockNumber = useBlockHash();
  const counterContract = useCounterContract();
  //const counter = useStarknetCall(counterContract, "counter");
  //const lastCaller = useStarknetCall(counterContract, "lastCaller");

  const { transactions } = useTransactions();
  console.log(transactions)
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();
  const [addrL1, setL1Address] = React.useState("0xadd");
  const updateL1Address = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setL1Address(evt.target.value);
    },
    [setL1Address]
  );
  //console.log(blockNumber)
  return (
    <div className="container">

      <h1>L1 connection</h1>
      <div className="row">
        <ConnectL1WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      </div>
      <div className="row">
        
      <ReadL1Balance  provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal}/>
      </div>
      
      <div className="row">
      
      <DepositL1  provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal}/>
      </div>
      
      <div className="row">
      <WithdrawL2  provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal}/>
      </div>
      
      
      <div className="row">
      <WithdrawL1  provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal}/>
      </div>
      
     
      <h1>L2 connection</h1>
        <ConnectedOnly>
          <IncrementCounter contract={counterContract} />
        </ConnectedOnly>
        
      <div className="row">
        The Current Block:{" "}
        {blockNumber && <VoyagerLink.Block block={blockNumber} />}
      </div>
      
      <div className="row">
        Counter Address:{" "}
        {counterContract?.connectedTo && (
          <VoyagerLink.Contract contract={counterContract?.connectedTo} />
        )}
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
