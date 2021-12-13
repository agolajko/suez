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

  const [amount_low, setAmount] = React.useState("0x1");
  const [amount_high, setAmount_high] = React.useState("0x1");
  const [addr, setAddress] = React.useState("0xadd");

  const updateAmount = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAmount(evt.target.value);
    },
    [setAmount]
  );  
  
  const updateAmount_high = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAmount_high(evt.target.value);
    },
    [setAmount_high]
  );
  console.log(setAmount)
  const updateAddress = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAddress(evt.target.value);
    },
    [setAddress]
  );

  //console.log(contract)
  if (!account) return null;

  return (
    <div className={styles.counter}>

      <div className="row">
      <input onChange={updateAddress} value={addr} type="text" />
      <input onChange={updateAmount} value={amount_low} type="text" />
      <input onChange={updateAmount_high} value={amount_high} type="text" />
        <button
          onClick={() => withdraw && withdraw({addr, amount_low, amount_high})}
          disabled={!withdraw || submitting}
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
