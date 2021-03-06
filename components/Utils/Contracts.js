import React, { useState }  from "react";
import axios from "axios";
import { useWallet } from 'use-wallet';
import { commitMgrServerUrl } from "../../configs/commit_mgr.env";

/*
export function useUser() {
    const wallet = useWallet();
    const [user, setUser] = useState(wallet.account);
    const [status, setStatus] = useState(wallet.status);
    const [loading, setLoading] = useState(false);

    return {user: user, status: status, loading: loading};
  }
*/

export function useContract() {

  const contractsAvailable = axios.get(`${commitMgrServerUrl}/contracts-available`)
    .then((response) => {
        //access the resp here....
        
        return response.data;
    })
    .catch((error) => {
        console.log(error);
    });

    //console.log(contractsAvailable)
    const [contracts, setContracts] = useState(contractsAvailable);

    return { contracts: contracts };
}