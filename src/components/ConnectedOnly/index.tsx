import React , {useEffect, useState} from "react";
import { useStarknet } from "../../providers/StarknetProvider";

import styles from "./index.module.css";

interface ConnectedOnlyProps {
  children: React.ReactNode;
}

export function ConnectedOnly({ children }: ConnectedOnlyProps): JSX.Element {
  const { account, connectBrowserWallet } = useStarknet();
  const [rendered, setRendered] = useState("");
//  console.log(account?.substring(0,10))
 
  useEffect(()=> {
    let acc1 = account === null || account === undefined ? 0 : 1;
    try{
    if (acc1 ==1 ){ setRendered(account?.substring(0, 6) + "..." + account?.substring(59));};
  } catch (err){
    setRendered("");
  }
  },[account,setRendered ] )
  //if (!account) {
    return (
        <button
          className={styles.connect}
          onClick={() => connectBrowserWallet()}
        >
      {rendered === "" && "Connect Starknet L2 Wallet"}
      {rendered !== "" && rendered}</button>
    );
  //}
  return <React.Fragment>{children}</React.Fragment>;
}
