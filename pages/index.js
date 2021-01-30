import React, { useEffect }  from "react";
import { useRouter } from 'next/router';
import dotenv from "dotenv";
import { useUser } from '../components/Utils/useUser';
import Iframe from '../components/Utils/Iframe';

// components

//import CardLineChart from "../components/Cards/CardLineChart.js";
//import CardBarChart from "../components/Cards/CardBarChart.js";
//import CardSocialTraffic from "../components/Cards/CardSocialTraffic.js";
import CardContracts from "../components/Cards/CardContracts.js";
import CardTree from "../components/Cards/CardTree.js";

// layout for page
import Admin from "../layouts/Admin.js";
//const useUser = () => ({ user: false, status: 'disconnected', loading: false })

dotenv.config();

export default function Index() {
  // Here you would fetch and return the user
  const { user, status, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if ( !(user || loading) || status === 'disconnected' ) {
      router.push('/auth/login');
    }
  }, [user, status, loading]);


  return (
    <>
      <div className="flex flex-wrap">

      <div className="w-full xl:w-4/12 px-4">
          <CardTree title="[DB] Infura" />
        </div>
        <div className="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
          <CardContracts title="Contracts Infura [ Goerli Network ]" />
        </div>

      <div className="w-full xl:w-4/12 px-4">
          <CardTree title="[DB] Local" />
        </div>
        <div className="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
          <CardContracts title="Contracts [ Besu Local ]" />
        </div>
      </div>      
      <div className="w-full mb-3 px-4">
        {/*<div dangerouslySetInnerHTML={{ __html: "<iframe src='./baseline-commit-mgr-tests-report.html' width='100%' height='600px' />"}} />*/}
        {process.env.NODE_ENV === 'production' ? <Iframe source={'./baseline-commit-mgr-tests-report.html'} /> : ''}
      </div>

      {/*<div className="flex flex-wrap mt-4">
        <div className="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
          <CardPageVisits />
        </div>
        <div className="w-full xl:w-4/12 px-4">
          <CardSocialTraffic />
        </div>
      </div>*/}
    </>
  );
}

Index.layout = Admin;
