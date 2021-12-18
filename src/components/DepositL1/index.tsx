import React, { useEffect, useState } from "react";
import Big from "big.js";
import { ethAddress, starknetAddress } from  "../../addresses"
import { Web3Provider} from "@ethersproject/providers";
import  abis  from "../../lib/abi/abis.js";
import { Contract } from "@ethersproject/contracts";

/////////////////////////////////////////////////////////////////////
async function depositInner(l2ContractAddress, l2UserAddress, depositAmount) {
  
  const provider = new Web3Provider(window.ethereum);
  const signer= provider.getSigner();
  const oldl1l2 = new Contract(ethAddress, abis.oldl1l2, signer);
  let overrides = {

    
    // The amount to send with the transaction (i.e. msg.value)
    value: (Big(10**18).times(Big(depositAmount))).round(0, Big.roundDown).toString(),//utils.parseEther(depositAmount),
  };
  
   let currentReturn =await oldl1l2.deposit(l2ContractAddress, l2UserAddress, overrides);//we have to specify amount here, and also above
   console.log(typeof(currentReturn._hex));
   let currentvalue=String(currentReturn._hex);
  return(currentvalue)
}

export function DepositL1({ provider, loadWeb3Modal, logoutOfWeb3Modal}) {
  
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
      
      let stringCurrentValue=(currentValue).toString();
      setRendered("   "+stringCurrentValue);
    };
    
  return( <div className="row">
         <input onChange={updateL2UserAddress} value={l2UserAddress} type="text" placeholder="l2 User address"/>
         &nbsp;
          <input onChange={updateDepositAmount} value={depositAmount} type="text" placeholder="amount"/>
          &nbsp;
        <button
          onClick={() => sendDeposit(starknetAddress, l2UserAddress, depositAmount)}
        >
         Deposit 
        </button>
      </div>);  
}

