import React from "react";
import useSwr from 'swr';
import axios from "axios";
import { Alert } from "../Utils/Alert";
import { AlertSwitcher } from "../Utils/Switcher";
//import { useWallet } from 'use-wallet';

// components
import CardStats from "components/Cards/CardStats.js";

const fetcher = (url) => fetch(url).then((res) => res.json());

const fetcherStatus = (url) => {
  return fetch(url, {
   headers: {
    /*Authorization: `Bearer ${localStorage.getItem('token')}`,*/
    'Content-Type': 'application/text',
   },
  }).then((res) => { 
    let result = res.statusText;
    return result;
    })};

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}    

const switchChain = async (network) => {

  await axios.post('http://api.baseline.test/switch-chain', {
      network: network,
    })
    .then((response) => {
        //access the resp here....
        const currentChain = response.data;
        console.log(`Current Chain: ${currentChain}`);
        AlertSwitcher(9000, 'warning', 'Switching Network Mode...', `Commitment manager reconnecting to a network..`, 'Close now');
        //sleep(6000).then(() => {
          //do stuff
          //Alert('success', 'Network Mode Switched...', `Commitment manager connected to ${network} [${currentChain}] network..`);
          //window.location.reload();
        //});
        return currentChain;
    })
    .catch((error) => {
        console.log(error);
        Alert('error', 'ERROR...', error);
    });

}


export default function HeaderStats() {

  //const wallet = useWallet();
  const { data: status, error: statusError } = useSwr('http://api.baseline.test/status', fetcherStatus);
  const { data: network, error: netError } = useSwr('http://api.baseline.test/network-mode', fetcher);
  const { data: db, error: dbError } = useSwr('http://api.baseline.test/db-status', fetcher);
  const { data: commitments, error: commitError } = useSwr('http://api.baseline.test/get-commiments', { refreshInterval: 3000, fetcher: fetcher });
  
  return (
    <>
      {/* Header */}
      <div className="relative bg-gray-900 md:pt-32 pb-32 pt-12">
        <div className="px-4 md:px-10 mx-auto w-full">
          <div>
            {/* Card stats */}
            <div className="flex flex-wrap">
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="COMMITMENTS"
                  statTitle={commitments ? commitments.length : "0"}
                  statArrow="up"
                  statPercent=" "
                  statPercentColor="text-blue-500"
                  statDescription={network ? `localhost:${network.commitServerPort}` : 'Loading...'}
                  statIconName="fa fa-cubes"
                  statIconColor="bg-blue-500"
                />
              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="DATABASE"
                  statTitle={db ? db.dbHost : 'Loading...'}
                  statArrow="up"
                  statPercent=" "
                  statPercentdaColor="text-red-500"
                  statDescription={db ? `${db.dbUrl}` : 'Loading...'}
                  statIconName="fas fa-database"
                  statIconColor={network ? (network.chainId === "101010" ? "bg-orange-500" : "bg-green-500") : 'bg-gray-300'}
                />
              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="NETWORK MODE"
                  statTitle={network ? network.chainName : 'Loading...'}
                  statArrow="up"
                  statPercent={network ? `[ ${network.chainId} ]`: 'Loading...'}
                  statPercentColor="text-green-500"
                  statDescription={network ? (network.chainId !== "101010" ? "Connected to PUBLIC" : "Connected to LOCAL") : 'Loading...'}
                  statIconName="fa fa-th"
                  statIconColor={network ? (network.chainId === "101010" ? "bg-red-500" : "bg-green-500") : 'bg-gray-300'}
                />
              <button
              className={ network ? (network.chainId !== "101010"
                ? "w-full bg-red-500 text-white active:bg-red-600 text-xs font-bold uppercase px-3 py-1 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                : "w-full bg-green-500 text-white active:bg-green-600 text-xs font-bold uppercase px-3 py-1 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
              ) : ''}
              type="button"
              onClick={() => network.chainId !== "101010" ? switchChain('local') : switchChain(network.chainId)}
              >
                { network ? (network.chainId === "101010" ? 'SWITCH NETWORK [MAIN/TESTNET]' : 'SWITCH NETWORK [LOCAL]') : 'Loading...'}
              </button>
              </div>              
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="STATUS"
                  statTitle={!status ? "Loading..." : status}
                  statArrow="up"
                  statPercent={network ? `[${network.commitServerPort}]` : '...'}
                  statPercentColor="text-green-500"
                  statDescription={statusError ? "Failed to load status" : "Commitment-mgr status"}
                  statIconName={statusError ? "fas fa-error" : "fas fa-check"}
                  statIconColor={statusError ? "bg-red-500" : "bg-green-500"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
