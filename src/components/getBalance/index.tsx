import React from "react";
import { Contract } from "starknet";
import { useStarknetInvoke, useStarknetCall } from "../../lib/hooks";
import { useStarknet } from "../../providers/StarknetProvider";
import { useTransaction } from "../../providers/TransactionsProvider";
import { VoyagerLink } from "../VoyagerLink";

import styles from "./index.module.css";  

export function GetBalance({ contract}: { contract?: Contract}) {
  const { account } = useStarknet();
   
  const value = 12;

  //const value  = useStarknetCall(contract, "getBalance", "0x051a96612fbc951f5cc2156556c4dfa0cbb374447c9ef79a1db6d7075176c451");
  //const value  = useStarknetCall(contract, "getBalance", account);

  const [addr, setAddress] = React.useState("0xadd");

  const updateAddress = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      setAddress(evt.target.value);
    },
    [setAddress]
  );

  //console.log(value)
  //if (!account) return null;

  return (
    <div className={styles.counter}>
      <div className="row">

        Your balance: {value}
        
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
 