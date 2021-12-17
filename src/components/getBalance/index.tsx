import React from "react";
import { Contract } from "starknet";
import { useStarknetInvoke, useStarknetCall } from "../../lib/hooks";
import { useStarknet } from "../../providers/StarknetProvider";
import { useTransaction } from "../../providers/TransactionsProvider";
import { VoyagerLink } from "../VoyagerLink";
import Big from "big.js";
import styles from "./index.module.css";  

export function GetBalance({ contract}: { contract?: Contract}) {
  const { account } = useStarknet();
   
  //const value = 12;
  //let value: any  = useStarknetCall(contract, "getBalance", ["2308540148694671285865417627099065456738507260679927862090683974016524797009"]);
  let value: any  = useStarknetCall(contract, "getBalance", [account]);

  let val_low = value?.balance?.low
  let val_high = value?.balance?.high
  //let val_total =parseInt(val_low)+2**128 * parseInt(val_high, 16)
  //let val_total =((Big(BigInt(val_low)).add(Big(2**128).times(Big(BigInt(val_high))))).div(Big(10**18))).toString()

  //if (val_low_undef == "undefined"){let val_low=0} {let val_low = val_low_undef}; 
  //if (val_high_undef == "undefined"){let val_high=0} {let val_high = val_high_undef};
  //console.log(val_low)
  //console.log(val_high)
  //console.log(BigInt(val_low)/BigInt(10**9))
  //console.log(BigInt(BigInt(val_low)+BigInt(2**128) * BigInt(val_high)))
  if (val_low && val_high) {let val_total =(Big(BigInt(BigInt(val_low)+BigInt(2**128) * BigInt(val_high)).toString()).div(Big(10**18))).toString();
  console.log(val_total)

  return (
    <div className={styles.green}>

        Your Starknet balance: {val_total} eth
        

    </div>
      )
    
  }


 {  return (
    <div className={styles.green}>

        Your Starknet balance: 0 eth
        

    </div>
      ) }
    
    
}
 
