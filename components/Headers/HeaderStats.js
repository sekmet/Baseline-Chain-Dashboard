import React from "react";
import useSwr from 'swr';
import axios from "axios";
import { Alert } from "../Utils/Alert";
//import { useWallet } from 'use-wallet';

// components
import CardStats from "components/Cards/CardStats.js";

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

const switchChain = async (network) => {

  await axios.post('http://api.baseline.test/switch-chain', {
      network: network,
    })
    .then((response) => {
        //access the resp here....
        const currentChain = response.data;
        console.log(`Current Chain: ${currentChain}`);
        Alert('success', 'Network Mode Switched...', `Commitment manager connected to ${network} [${currentChain}] network..`);
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
  const { data: network, error: netError } = useSwr('http://api.baseline.test/network-mode');
  console.log(status, network)

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
                  statSubtitle="WORKGROUPS"
                  statTitle="2,356"
                  statArrow="down"
                  statPercent="3.48"
                  statPercentColor="text-red-500"
                  statDescripiron="Since last week"
                  statIconName="fas fa-users"
                  statIconColor="bg-orange-500"
                />
              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="COMMITMENTS"
                  statTitle="924"
                  statArrow="down"
                  statPercent="1.10"
                  statPercentColor="text-orange-500"
                  statDescripiron="Since yesterday"
                  statIconName="fa fa-cubes"
                  statIconColor="bg-blue-500"
                />
              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="NETWORK MODE"
                  statTitle={network !== 101010 ? "GOERLI" : `LOCAL`}
                  statArrow="up"
                  statPercent={`[${network}]`}
                  statPercentColor="text-green-500"
                  statDescripiron={network !== 101010 ? "Connected to PUBLIC" : "Connected to LOCAL"}
                  statIconName="fa fa-th"
                  statIconColor="bg-red-500"
                />
              <button
              className={ network !== 101010
                ? "w-full bg-red-500 text-white active:bg-red-600 text-xs font-bold uppercase px-3 py-1 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                : "w-full bg-green-500 text-white active:bg-green-600 text-xs font-bold uppercase px-3 py-1 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
              }
              type="button"
              onClick={() => network !== 101010 ? switchChain('local') : switchChain(network)}
              >
                { network === 101010 ? 'SWITCH NETWORK [MAIN/TESTNET]' : 'SWITCH NETWORK [LOCAL]'}
              </button>
              </div>              
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="STATUS"
                  statTitle={!status ? "Loading..." : status}
                  statArrow="up"
                  statPercent="UP"
                  statPercentColor="text-green-500"
                  statDescripiron={statusError ? "Failed to load status" : "Baseline commit-mgr status"}
                  statIconName="fas fa-check"
                  statIconColor="bg-green-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
