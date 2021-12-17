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
import { Contract as StarkwareContract} from "starknet";

import { ConnectedOnly } from "./components/ConnectedOnly";
import { GetBalance } from "./components/getBalance";
import { Transfer } from "./components/Transfer";
import { Withdraw_from_L2 } from "./components/WithdrawL2";
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
import Big from "big.js";

declare let window: any;
const ethAddress="0x15b01475bb3070912216dc393c3a782cc90fa1f7";
const starknetAddress="0x035572dec96ab362c35139675abc4f1c9d6b15ee29c98fbf3f0390a0f8500afa";


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


/////////////////////////////////////////////////////////
function ReadL1Balance({ provider, loadWeb3Modal, logoutOfWeb3Modal}) {
  const [account, setAccount] = useState("");
  const [rendered, setRendered] = useState("");
  const [l1Address, setL1Address] = React.useState("");
  const updateL1Address = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setL1Address(evt.target.value);
    },
    [setL1Address]
  );
//What we want here, is an input that updates, that is done with updateL1Address and React.Callback. We also need a button, that when pushed, returns the ReadL1BalanceInner. There is no need for useEffect, it seems to me. 
  
    async function fetchAmount(l1Address) {
      let currentValue=await ReadL1BalanceInner(l1Address);
      //console.log(typeof(currentValue));
      //console.log(currentValue);
      let stringCurrentValue=((currentValue)).toString();
      //console.log(parseInt(stringCurrentValue)/10**18);
      setRendered("   "+parseInt(stringCurrentValue, 16)/10**18+"  eth");
    };
    
    
    

  return( <div className="row">
        <input onChange={updateL1Address} value={l1Address} type="text" placeholder="l1 User Address"/>&nbsp;
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
  const oldl1l2 = new Contract(ethAddress, abis.oldl1l2, signer);
  //await provider.sendTransaction("0x3fD09c109fb7112068142d821f296Ad51592F4F6", );
   let currentReturn =await oldl1l2.accountBalances(address);
  // console.log(typeof(currentReturn._hex));
   let currentvalue=String(currentReturn._hex);
  return(currentvalue)
}

/////////////////////////////////////////////////////////////////////
function DepositL1({ provider, loadWeb3Modal, logoutOfWeb3Modal}) {
  
  const [rendered, setRendered] = useState("");
  
  const [depositAmount, setDepositAmount] = React.useState("");
  const [l2ContractAddress, setL2ContractAddress] = React.useState("l2ContractAddress");
  const [l2UserAddress, setL2UserAddress] = React.useState("");
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
        {/*<input onChange={updateL2ContractAddress} value={l2ContractAddress} type="text" />*/}
         <input onChange={updateL2UserAddress} value={l2UserAddress} type="text" placeholder="l2 User address"/>
         &nbsp;
          <input onChange={updateDepositAmount} value={depositAmount} type="text" placeholder="amount"/>
          &nbsp;
        <button
          onClick={() => sendDeposit(starknetAddress, l2UserAddress, depositAmount)}
        >
         Deposit 
        </button>
        {rendered === "" && ""}
      {rendered !== "" && rendered}
      </div>);  
}

async function depositInner(l2ContractAddress, l2UserAddress, depositAmount) {
  
  const provider = new Web3Provider(window.ethereum);
  const signer= provider.getSigner();
  //console.log( abis.oldl1l2);
  const oldl1l2 = new Contract(ethAddress, abis.oldl1l2, signer);
  //await provider.sendTransaction("0x3fD09c109fb7112068142d821f296Ad51592F4F6", );
  let overrides = {

    
    // The amount to send with the transaction (i.e. msg.value)
    //value: String(Big(Math.floor(Big(10**18).times(Big(depositAmount))))),//utils.parseEther(depositAmount),
    value: (Big(10**18).times(Big(depositAmount))).round(0, Big.roundDown).toString(),//utils.parseEther(depositAmount),
  };
  
   let currentReturn =await oldl1l2.deposit(l2ContractAddress, l2UserAddress, overrides);//we have to specify amount here, and also above
   console.log(typeof(currentReturn._hex));
   let currentvalue=String(currentReturn._hex);
  return(currentvalue)
}

///////////////////////////////////////////////////////////////
function WithdrawL2({ contract}: { contract?: StarkwareContract} ) {
  
  const { account } = useStarknet();
  const {
    invoke: withdraw,
    hash,
    submitting,
  } = useStarknetInvoke(contract, "withdraw");
  
  const [rendered, setRendered] = useState("");
  
  const [l2ContractAddress, setL2ContractAddress] = React.useState("l2ContractAddress");
  const [l2UserAddress, setL2UserAddress] = React.useState("");
  const [l1UserAddress, setL1UserAddress] = React.useState("");
  const [amount, setAmount] = React.useState("");
  
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
  
    ///////////////////////////////
    async function sendWithdrawL2(l2ContractAddress, l2UserAddress, l1UserAddress, amount, { contract}: { contract?: StarkwareContract}, {account}, {withdraw}, {hash}) {
      function get_amount_low(one_num){
	      if (one_num == "") {return String(0)}
	      let new_int = BigInt(Math.floor(10**18*Big(one_num)));
	      let am_low = new_int % BigInt((2**128));
	      return String(am_low)
  }

      function get_amount_high(one_num){
	    if (one_num == "") {return String(0)}
	    const new_int = BigInt(Math.floor(10**18*Big(one_num)));
	    const am_high = String(new_int / BigInt(2**128));
	    return am_high
  }
  
     let amount_low=get_amount_low(amount);
     let amount_high=get_amount_high(amount);
     if (withdraw) {withdraw({l1UserAddress, amount_low, amount_high})}
    };
    
    async function sendWithdrawL2toL1(l2ContractAddress, l2UserAddress, l1UserAddress, amount, { contract}: { contract?: StarkwareContract}, {account}, {withdraw}, {hash}) {
      const provider = new Web3Provider(window.ethereum);
      const signer= provider.getSigner();
  //console.log( abis.oldl1l2);
      const oldl1l2 = new Contract(ethAddress, abis.oldl1l2, signer);
      
      let currentReturn =await oldl1l2.withdrawFromL2(l2ContractAddress, l2UserAddress, String(BigInt(Math.floor(10**18*Big(amount)))));
    };
    
    async function sendWithdrawL1(l2ContractAddress, l2UserAddress, l1UserAddress, amount, { contract}: { contract?: StarkwareContract}, {account}, {withdraw}, {hash}) {
      const provider = new Web3Provider(window.ethereum);
      const signer= provider.getSigner();
  //console.log( abis.oldl1l2);
      const oldl1l2 = new Contract(ethAddress, abis.oldl1l2, signer);
      let currentReturn =await oldl1l2.withdrawFromL1(String(BigInt(Math.floor(10**18*Big(amount)))));
    }; 
    /////////////////////////////////////////////
    
  return( <div className="row">
        {/*<input onChange={updateL2ContractAddress} value={l2ContractAddress} type="text" />*/}
        <input onChange={updateL2UserAddress} value={l2UserAddress} type="text" placeholder="l2 User address" />
        &nbsp;
        <input onChange={updateL1UserAddress} value={l1UserAddress} type="text" placeholder="l1 User address"/>
        &nbsp;
        <input onChange={updateAmount} value={amount} type="text" placeholder="amount"/>
        <br></br>
        <button
          onClick={() => sendWithdrawL2(starknetAddress, l2UserAddress, l1UserAddress, amount, {contract}, {account}, {withdraw}, {hash})}
        >
       1. First withdraw from Starknet  
        </button>
        <br></br>
        &nbsp; wait 5 minutes to process on Ethereum ⏰ &nbsp;
        <br></br>
        <button
          onClick={() => sendWithdrawL2toL1(starknetAddress, l2UserAddress, l1UserAddress, amount, {contract}, {account}, {withdraw}, {hash})}
        >
        2. Next move to your wallet
        </button>
        {/*&nbsp;  &nbsp;
        <button
          onClick={() => sendWithdrawL1(starknetAddress, l2UserAddress, l1UserAddress, amount, {contract}, {account}, {withdraw}, {hash})}
        >
         3 
        </button>*/}
        {rendered === "" && " "}
      {rendered !== "" && rendered}
      </div>);
}



//////////////////////////////////////////////////////////////

function WithdrawL1({ provider, loadWeb3Modal, logoutOfWeb3Modal}) {
  const [account, setAccount] = useState("");
  const [rendered, setRendered] = useState("");
  const [amount, setAmount] = React.useState("");
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
        <input onChange={updateAmount} value={amount} type="text" placeholder="amount"/>
        &nbsp;  
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
  const oldl1l2 = new Contract(ethAddress, abis.oldl1l2, signer);
  //await provider.sendTransaction("0x3fD09c109fb7112068142d821f296Ad51592F4F6", );
  
  //console.log(typeof(amount));
  
   
   let currentReturn =await oldl1l2.withdrawFromL1(String(BigInt(Math.floor(10**18*Big(amount)))));//we have to specify amount here, and also above
   //console.log(typeof(currentReturn._hex));
   let currentvalue=String(currentReturn._hex);
  return(currentvalue)
}


////////////////////////////////////////

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


{/*
<div className="row" title="Use this to withdraw from L2, after sending the withdraw message on L2, see below.You need to use the same inputs as before, the L2 account address, that you are withdrawing from, the L1 account that you are withdrawing to, and the amount that you are withdrawing. This is the second step of the withdrawal process. ">
      
      <WithdrawL2  provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal}/>
      </div>
      
      <div className="row" title="Use this command to view your balance on the L1 contract. This is useful only before Withdrawing from L1.">
         
      <ReadL1Balance  provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal}/>
      </div>
      
      
      
      
      <div className="row" title="Use this to withdraw from L2. This is a three step process, this is the first step. Specify to which L1 account you wish to transfer (make this precise, as your funds will otherwise be lost), and the amount in eth that you wish to transfer.">
           
        <Withdraw_from_L2 contract={counterContract} />
        </div>
        
        
        title="Use this to withdraw form L1, after you have used the previous WithdrawL2 button. You only need to specify the amount in eth, but need to use the account in metamask that you specified in step 2. This is the third and final step of the withdrawal."
*/}

function App() { 
  const blockNumber = useBlockHash();
  const counterContract = useCounterContract();
  //const counter = useStarknetCall(counterContract, "counter");
  //const lastCaller = useStarknetCall(counterContract, "lastCaller");

  const { transactions } = useTransactions();
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();
  const [addrL1, setL1Address] = React.useState("0xadd");
  const updateL1Address = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setL1Address(evt.target.value);
    },
    [setL1Address]
  );
  //let ret_value : any = useStarknetCall(counterContract, "getBalance", ["2308540148694671285865417627099065456738507260679927862090683974016524797009"]);
  //console.log("ret value")
  //const low_bal = ret_value?.balance?.low
  //console.log(low_bal) 
  //console.log(ret_value?.balance?.low) 
  //console.log(blockNumber)
  return (
    <div className="container">

      <div className="row">
      
        <ConnectL1WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      </div>

      <ConnectedOnly>
      </ConnectedOnly>      

      <GetBalance contract={counterContract} />

     <h1>Deposit to Starknet</h1>



      
      
      <div className="row" title="Use this to deposit ether directly to L2. Input your L2 account address, and the amount in eth that you want to deposit.">
       
      <DepositL1  provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal}/>
      </div>
      
      
      
      
      
     
      <h1>Withdraw from Starknet</h1>
     <p className = "starknetexplain"> Withdrawal from Starknet back to your Ethereum wallet consists of 3 steps:</p>
     <ol className="starknetexplain">
        <li>  Press to Withdraw your balance from Starknet to the bridge</li>
        <li> Wait 5 minutes ⏰ to cross the bridge (consume transaction) </li>
        <li> Move the money to your Ethereum wallet from the bridge </li>
     </ol>
        
        <div className="row" >
       
      <WithdrawL2  contract={counterContract}/>
      </div>
        
      <h1>Transfer within Starknet</h1>

        
        {/*<div className="row" title="Use this to transfer to other accounts on L2. Input the account that you wish to transfer to, and the amount in eth that you wish to transfer.">*/}
        <Transfer contract={counterContract} />
        
        
        

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
        {/*<p className="grey">Contract Address:{" "}</p>*/}
        Starknet Cairo Contract Address:{" "}
        {counterContract?.connectedTo && (
          <VoyagerLink.Contract contract={counterContract?.connectedTo} />
        )}
      </div>   
      <div className="rowgrey">
        {/*<p className="grey">Contract Address:{" "}</p>*/}
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
