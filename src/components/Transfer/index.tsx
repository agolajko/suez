import React from "react";
import { Contract } from "starknet";
import { useStarknetInvoke } from "../../lib/hooks";
import { useStarknet } from "../../providers/StarknetProvider";
import { useTransaction } from "../../providers/TransactionsProvider";
import { VoyagerLink } from "../VoyagerLink";

import styles from "./index.module.css";  

export function Transfer({ contract}: { contract?: Contract}) {
  const { account } = useStarknet();
  const {
    invoke: transfer,
    hash,
    submitting,
  } = useStarknetInvoke(contract, "transfer");
  const transactionStatus = useTransaction(hash);

  const [amount, setAmount] = React.useState("0");
  const [amount_low, setAmount_low] = React.useState("0x1");
  const [amount_high, setAmount_high] = React.useState("0");
  const [addr, setAddress] = React.useState("0xadd");

  const updateAmount = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAmount(evt.target.value);
      setAmount_low(get_amount_low(evt.target.value));
      setAmount_high(get_amount_high(evt.target.value));
    },
    [setAmount]
  );
  
{/*}  const updateAmount_low = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAmount_low(evt.target.value);
    },
    [setAmount_low]
  );  
  
  const updateAmount_high = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAmount_high(evt.target.value);
      // new splitting features
      //console.log(amount_high)
      //console.log(parseInt(amount_high))
      //console.log(typeof(amount_high))
      //const new_high = get_amount_high(amount_high)
      //const new_high = get_amount_high(evt.target.value)
      //setAmount_high(new_high);

      //console.log(new_high)
    },
    [setAmount_high]
  );
  */}

  console.log(amount)
  console.log(amount_low)
  console.log(amount_high)
  //const new_high = get_amount_high(amount_high)
  //console.log(new_high)
  
  //console.log(setAmount)
  const updateAddress = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAddress(evt.target.value);
    },
    [setAddress]
  );

  function get_amount_low(one_num){
    if (one_num == "") {return String(0)}
    let new_int = BigInt(one_num);
    let am_low = new_int % BigInt((2**128));
    return String(am_low)
  }

  function get_amount_high(one_num){
    if (one_num == "") {return String(0)}
    const new_int = BigInt(one_num);
    console.log(new_int)
    const am_high = String(new_int / BigInt(2**128));
    return am_high
  }
  

  //console.log(contract)
  if (!account) return null;

  return (
    <div className={styles.counter}>
      <div className="row">
        Account:
        <VoyagerLink.Contract contract={account} />
        <br></br>
        {amount_low}
        <br></br>
        {amount_high}
      </div>
      <div className="row">
      <input onChange={updateAddress} value={addr} type="text" />
      {/*<input onChange={updateAmount} value={amount_low} type="text" />*/}
      <input onChange={updateAmount} value={amount} type="text" />
        <button
          onClick={() => transfer && transfer({addr, amount_low, amount_high})}
          disabled={!transfer || submitting}
        >
         Transfer 
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
