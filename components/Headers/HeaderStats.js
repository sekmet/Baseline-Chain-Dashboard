import React from "react";
import useSwr from 'swr';
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

  //const fetcher = (url) => fetch(url).then((res) => res);

export default function HeaderStats() {

  //const wallet = useWallet();
  const { data, error } = useSwr('http://api.baseline.test/status', fetcherStatus);

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
                  statSubtitle="LATEST BLOCK"
                  statTitle="9563269"
                  statArrow="up"
                  statPercent="3.48"
                  statPercentColor="text-green-500"
                  statDescripiron="Since last month"
                  statIconName="fa fa-th"
                  statIconColor="bg-red-500"
                />
              </div>
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
                  statSubtitle="STATUS"
                  statTitle={!data ? "Loading..." : data}
                  statArrow="up"
                  statPercent="UP"
                  statPercentColor="text-green-500"
                  statDescripiron={error ? "Failed to load status" : "Baseline commit-mgr status"}
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
