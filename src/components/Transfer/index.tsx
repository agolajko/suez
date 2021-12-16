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

 // console.log(amount)
  //console.log(amount_low)
  //console.log(amount_high)
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
    let new_int = BigInt(Math.floor(10**18*parseFloat(one_num)));
    let am_low = new_int % BigInt((2**128));
    return String(am_low)
  }

  function get_amount_high(one_num){
    if (one_num == "") {return String(0)}
    const new_int = BigInt(Math.floor(10**18*parseFloat(one_num)));
    console.log(new_int)
    const am_high = String(new_int / BigInt(2**128));
    return am_high
  }
  
  function transferWithError(params){
  	try{ if (transfer) transfer(params);
  	return(1)}
  	catch  { return(0)}
  	finally {return (0)}
  }
  //console.log(contract)
  //if (!account) return null;
	
  try {	
  return (
    <div className={styles.counter}>
       
        
        
        
      <div className="row">
      <input onChange={updateAddress} value={addr} type="text" placeholder="recipient Address"/>
      &nbsp;
      {/*<input onChange={updateAmount} value={amount_low} type="text" />*/}
      <input onChange={updateAmount} value={amount} type="text" placeholder="amount"/>
      &nbsp;
      	
        <button
          onClick={() => transfer && transfer({addr, amount_low, amount_high})}
          //Tried transferWithError here, that did not catch the error either. 
          //disabled={!transfer || submitting}
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
  } catch (err) {console.error(err);
  return(<div>hello</div>);}
  //finally {(<div>bello</div>)}
}
