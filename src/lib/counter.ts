import React from "react";
import { Contract, Abi } from "starknet";
import { useStarknet } from "../providers/StarknetProvider";

//import COUNTER from "./abi/oldl1l2_abi.json";
import OLDL1 from "./abi/l2_abi.json";

const ADDRESS =
"0x035572dec96ab362c35139675abc4f1c9d6b15ee29c98fbf3f0390a0f8500afa";
  //"0x3625271e4c8e7e583c359e7cb2ce6be7437ca85395a4f5df4136b431b04b5bf";
    //"0x036486801b8f42e950824cba55b2df8cccb0af2497992f807a7e1d9abd2c6ba1";

/**
 * Load the counter contract.
 *
 * This example uses a hook because the contract address could depend on the
 * chain or come from an external api.
 * @returns The `counter` contract or undefined.
 */

/*
export function useCounterContract(): Contract | undefined {
  const { library } = useStarknet();
  const [contract, setContract] = React.useState<Contract | undefined>(
    undefined
  );

  React.useEffect(() => {
    setContract(new Contract(COUNTER as Abi[], ADDRESS, library));
  }, [library]);

  return contract;
}
*/

//////

//console.log(OLDL1)

export function useCounterContract(): Contract | undefined {
  const { library } = useStarknet();
  const [contract, setContract] = React.useState<Contract | undefined>(
    undefined
  );

  React.useEffect(() => {
    setContract(new Contract(OLDL1 as Abi[], ADDRESS, library));
  }, [library]);

  return contract;
}
