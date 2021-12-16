import React from "react";
import { Contract } from "starknet";
import { useStarknetInvoke } from "../../lib/hooks";
import { useStarknet } from "../../providers/StarknetProvider";
import { useTransaction } from "../../providers/TransactionsProvider";
import { VoyagerLink } from "../VoyagerLink";

import styles from "./index.module.css";  

export function Withdraw_from_L2({ contract}: { contract?: Contract}) {
  const { account } = useStarknet();
  const {
    invoke: withdraw,
    hash,
    submitting,
  } = useStarknetInvoke(contract, "withdraw");
  const transactionStatus = useTransaction(hash);

  const [amount, setAmount] = React.useState("");
  const [amount_low, setAmount_low] = React.useState("");
  const [amount_high, setAmount_high] = React.useState("");
  const [addr, setAddress] = React.useState("");

  const updateAmount = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      
      setAmount(evt.target.value);
      setAmount_low(get_amount_low(evt.target.value));
      setAmount_high(get_amount_high(evt.target.value));
    },
    [setAmount]
  );  
  
  
  //console.log(setAmount)
  const updateAddress = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAddress(evt.target.value);
    },
    [setAddress]
  );

	
  function get_amount_low(one_num){
    if (one_num == "") {return String(0)}
    let new_int = BigInt(Math.floor(10**18*parseFloat(one_num)));
    let am_low = new_int % BigInt((2**128));
    return String(am_low)
  }

  function get_amount_high(one_num){
    if (one_num == "") {return String(0)}
    const new_int = BigInt(Math.floor(10**18*parseFloat(one_num)));
    const am_high = String(new_int / BigInt(2**128));
    return am_high
  }

	console.log(amount);
	console.log(amount_low);
	console.log(amount_high);
  //console.log(contract)
  if (!account) return null;

  return (
    <div className={styles.counter}>

      <div className="row">
      <input onChange={updateAddress} value={addr} type="text" placeholder="l1 address"/>
      &nbsp;
      <input onChange={updateAmount} value={amount} type="text" placeholder="amount"/>
      &nbsp;
      
        <button
          onClick={() => withdraw && withdraw({addr, amount_low, amount_high})}
          //disabled={!withdraw || submitting}
        >
         Withdraw from L2 
        </button>
      </div>
      {transactionStatus && hash && (
        <div className="row">
          <h2>Latest Transaction</h2>
          <p>Status: {transactionStatus?.code}</p>
          <p>
            Hash: <VoyagerLink.Transaction transactionHash={hash} />
          </p>
        </div>
      )}
    </div>
  );
}
