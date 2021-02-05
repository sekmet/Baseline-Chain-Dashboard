import React, { useEffect, useState }  from "react";
import { useRouter } from 'next/router';
import dotenv from "dotenv";
import useSwr from 'swr';
import { useUser } from '../components/Utils/useUser';
import { isWalletConnected } from '../components/Utils/isWalletConnected';
import Iframe from '../components/Utils/Iframe';

// components
import CardContracts from "../components/Cards/CardContracts.js";
import CardTree from "../components/Cards/CardTree.js";

// layout for page
import Admin from "../layouts/Admin.js";
//const useUser = () => ({ user: false, status: 'disconnected', loading: false })

//import { createGlobalState } from 'react-hooks-global-state';

dotenv.config();

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Index() {
  // Here you would fetch and return the user
  const { data: network, error: netError } = useSwr('http://api.baseline.test/network-mode');

  const { user, status, loading } = useUser();
  const router = useRouter();
  const [contractShieldLocal, setContractShieldLocal] = useState('');
  const [contractShield, setContractShield] = useState('');

  let isConnectedWallet;

  useEffect(() => {
    
    isConnectedWallet = isWalletConnected();

    if ( !(user || loading) || status === 'disconnected' || !isConnectedWallet ) {
      router.push('/auth/login');
    }
    
  }, [user, status, loading, isConnectedWallet]);

  /*function updateContractShield(address) {
    if (network.chainName === 'LOCAL'){
      setContractShieldLocal(address);
    } else {
      setContractShieldLocal(address);
      setContractShield(address);
    }
  }*/


  return (
    <>
      <div className="flex flex-wrap" style={{minHeight: (network && network.chainId === "101010") ? '589px' : '150px'}}>
        <div className="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
          <CardContracts title="Contracts [ Besu / Ganache Local ]" network="local" contractShield={contractShieldLocal} setContractShield={setContractShieldLocal}/>
        </div>
        <div className="w-full xl:w-4/12 px-4">
          <CardTree title="[DB] Local" contractShield={contractShieldLocal} network="local" />
        </div>        
      </div>

      { network && network.chainId !== "101010" ? <div className="flex flex-wrap" style={{minHeight: (network && network.chainId !== "101010" && !contractShieldLocal) ? '589px' : '150px'}}>
        <div className="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
          <CardContracts title={`Contracts Infura [ ${network.chainName} ]`} network={network ? network.chainName.toLowerCase() : 'goerli'} walletAddress={network ? network.walletAddress : ''} setContractShield={setContractShield} />
        </div>
        <div className="w-full xl:w-4/12 px-4">
          <CardTree title="[DB] Infura" contractShield={contractShield} walletAddress={network ? network.walletAddress : ''} network={network ? network.chainName.toLowerCase() : 'goerli'} />
        </div>

      <div className="w-full mb-3 px-4">
        {process.env.NODE_ENV === 'production' ? <Iframe source={'./baseline-commit-mgr-tests-report.html'} /> : ''}
      </div>

      </div> : '' }
    </>
  );
}

Index.layout = Admin;
