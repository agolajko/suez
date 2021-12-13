import React from "react";
import { Contract } from "starknet";
import { useStarknetInvoke, useStarknetCall } from "../../lib/hooks";
import { useStarknet } from "../../providers/StarknetProvider";
import { useTransaction } from "../../providers/TransactionsProvider";
import { VoyagerLink } from "../VoyagerLink";

import styles from "./index.module.css";  

export function GetBalance({ contract}: { contract?: Contract}) {
  const { account } = useStarknet();
   
  //const value = 12;
  //let value: any  = useStarknetCall(contract, "getBalance", ["2308540148694671285865417627099065456738507260679927862090683974016524797009"]);
  let value: any  = useStarknetCall(contract, "getBalance", [account]);

  let val_low = value?.balance?.low
  let val_high = value?.balance?.high
  let val_total =parseInt(val_low)+2**128 * parseInt(val_high, 16)
  //const value  = useStarknetCall(contract, "getBalance", account);

  //const [addr, setAddress] = React.useState("0xadd");

  {/*const updateAddress = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAddress(evt.target.value);
    },
    [setAddress]
  );*/}

  //console.log(value?.balance?.low)
  //if (!account) return null;

  return (
    <div className={styles.counter}>
      <div className="row">

        Your balance: {val_total} 
        
      </div>
      <div className="row">
      {/*<input onChange={updateAddress} value={addr} type="text" />
        <button
          //onClick={() => ansfer && Transfer({addr, amount_low, amount_high})}
        >
         Get Balance 
  </button>*/}
      </div>
    </div>
      )}
 
