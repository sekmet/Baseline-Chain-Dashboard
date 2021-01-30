import React, { useState }  from "react";
import { useWallet } from 'use-wallet';

/*
export function useUser() {
    const wallet = useWallet();
    const [user, setUser] = useState(wallet.account);
    const [status, setStatus] = useState(wallet.status);
    const [loading, setLoading] = useState(false);

    return {user: user, status: status, loading: loading};
  }
*/

export function getTransactionReceipt(txHash) {

  axios.post('http://api.baseline.test/jsonrpc', {
    jsonrpc: "2.0",
    method: "eth_getTransactionReceipt",
    params: [txHash],
    id: 1,
    })
    .then((response) => {
        //access the resp here....
        const txDetails = res.body.result;
        let verifierAddress = txDetails.contractAddress;
        console.log(`Transaction Address: ${verifierAddress}`);
    })
    .catch((error) => {
        console.log(error);
    });

}