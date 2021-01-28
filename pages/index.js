import React, { useEffect }  from "react";
import { useRouter } from 'next/router';
import { useWallet } from 'use-wallet'

// components

import CardLineChart from "../components/Cards/CardLineChart.js";
import CardBarChart from "../components/Cards/CardBarChart.js";
import CardPageVisits from "../components/Cards/CardPageVisits.js";
import CardSocialTraffic from "../components/Cards/CardSocialTraffic.js";

// layout for page

import Admin from "../layouts/Admin.js";

// Here you would fetch and return the user

const useUser = () => ({ user: null, loading: true });

export default function Dashboard() {
  const wallet = useWallet();
  const { user, loading } = useUser({user: wallet.account, loading: false});
  const router = useRouter();

  useEffect(() => {
    if (!(user || loading)) {
      //router.push('/auth/login');
      console.log( user, loading, wallet.account );
    }
  }, [user, loading]);


  return (
    <>
      <div className="flex flex-wrap">
        <div className="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
          <CardPageVisits />
        </div>
        <div className="w-full xl:w-4/12 px-4">
          <CardSocialTraffic />
        </div>
      </div>
      <div className="flex flex-wrap mt-4">
        <div className="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
          <CardPageVisits />
        </div>
        <div className="w-full xl:w-4/12 px-4">
          <CardSocialTraffic />
        </div>
      </div>
    </>
  );
}

Dashboard.layout = Admin;
