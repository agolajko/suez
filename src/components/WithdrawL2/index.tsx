import React, { useEffect, useState } from "react";
import { useStarknetInvoke } from "../../lib/hooks";
import { useStarknet } from "../../providers/StarknetProvider";
import { useTransaction } from "../../providers/TransactionsProvider";
import { VoyagerLink } from "../VoyagerLink";
import Big from "big.js";
import { ethAddress, starknetAddress } from  "../../addresses"
import { Web3Provider} from "@ethersproject/providers";
import { Contract as StarkwareContract} from "starknet";
import  abis  from "../../lib/abi/abis.js";
import { Contract } from "@ethersproject/contracts";

import styles from "./index.module.css";  

export function WithdrawL2({ contract}: { contract?: StarkwareContract}) {
  
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
	      let new_int = Big(10**18).times(Big(one_num)).round(0, Big.roundDown);
	      let am_low = new_int.mod(Big(2**128));
	      return String(am_low)
  }

      function get_amount_high(one_num){
	    if (one_num == "") {return String(0)}
	    let new_int = Big(10**18).times(Big(one_num)).round(0, Big.roundDown);
	    const am_high = new_int.div(Big(2**128)).toString();
	    return am_high
  }
  
     let amount_low=get_amount_low(amount);
     let amount_high=get_amount_high(amount);
     if (withdraw) {withdraw({l1UserAddress, amount_low, amount_high})}
    };
    
    async function sendWithdrawL2toL1(l2ContractAddress, l2UserAddress, l1UserAddress, amount, { contract}: { contract?: StarkwareContract}, {account}, {withdraw}, {hash}) {
      const provider = new Web3Provider(window.ethereum);
      const signer= provider.getSigner();
      const oldl1l2 = new Contract(ethAddress, abis.oldl1l2, signer);
      
      const accurate_amount = (Big(10**18).times(Big(amount))).round(0, Big.roundDown).toString();
      let currentReturn =await oldl1l2.withdrawFromL2(l2ContractAddress, l2UserAddress, accurate_amount );
    };
    

    /////////////////////////////////////////////
    
  return( <div className="row">
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
        &nbsp; Wait 25 minutes ⏰ to cross the bridge  &nbsp;
        <br></br>
        <button
          onClick={() => sendWithdrawL2toL1(starknetAddress, l2UserAddress, l1UserAddress, amount, {contract}, {account}, {withdraw}, {hash})}
        >
        2. Next move to your wallet
        </button>
        {rendered === "" && " "}
      {rendered !== "" && rendered}
      </div>);
}

