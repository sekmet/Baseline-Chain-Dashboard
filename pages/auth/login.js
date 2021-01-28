import React, { useCallback, useEffect } from "react";
import { useWallet } from 'use-wallet'
import Link from "next/link";
import { useRouter } from 'next/router'

// layout for page

import Auth from "layouts/Auth.js";

export default function Login() {

  const router = useRouter();
  const wallet = useWallet();
  const blockNumber = wallet.getBlockNumber();

  if (wallet.status === 'connected'){
    router.push('/')
  }


  return (
    <>
      <div className="container mx-auto px-4 h-full">
        <div className="flex content-center items-center justify-center h-full">
          <div className="w-full lg:w-6/12 px-4">
            <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-gray-300 border-0">
              <div className="rounded-t mb-0 px-6 py-6">
                <div className="text-center mb-3">
                  <img src="https://www.baseline-protocol.org/images/baseline_Horizontal-Logo-allWhite.svg" />
                  <h3 className="text-gray-600 text-sm font-bold">
                    Connect with
                  </h3>
                </div>
                {wallet.status === 'connected' ? (
                  <div className="text-sm text-gray-600 font-semibold py-1 text-center md:text-left">
                    <h6>Account: {wallet.account}</h6>
                    <h6>Balance: {wallet.balance}</h6>
                    <button
                      className="bg-white active:bg-gray-100 text-gray-800 font-normal px-4 py-2 mt-6 rounded outline-none focus:outline-none mr-2 mb-1 uppercase shadow hover:shadow-md inline-flex items-center font-bold text-xs ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => wallet.reset()}
                    >
                      <img
                        alt="..."
                        className="w-5 mr-1"
                        src={require("assets/img/github.svg")}
                      />
                      Disconnect
                    </button>
                  </div>
                ) : (

                  <div className="btn-wrapper text-center">
                    <button
                      className="bg-white active:bg-gray-100 text-gray-800 font-normal px-4 py-2 rounded outline-none focus:outline-none mr-2 mb-1 uppercase shadow hover:shadow-md inline-flex items-center font-bold text-xs ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => wallet.connect()}
                    >
                      <img
                        alt="..."
                        className="w-5 mr-1"
                        src={require("assets/img/github.svg")}
                      />
                      MetaMask
                    </button>
                    <button
                      className="bg-white active:bg-gray-100 text-gray-800 font-normal px-4 py-2 rounded outline-none focus:outline-none mr-1 mb-1 uppercase shadow hover:shadow-md inline-flex items-center font-bold text-xs ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => wallet.connect('frame')}
                    >
                    <img
                      alt="..."
                      className="w-5 mr-1"
                      src={require("assets/img/google.svg")}
                    />
                    Frame
                  </button>
                  <button
                      className="bg-white active:bg-gray-100 text-gray-800 font-normal px-4 py-2 rounded outline-none focus:outline-none mr-1 mb-1 uppercase shadow hover:shadow-md inline-flex items-center font-bold text-xs ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => wallet.connect('portis')}
                    >
                    <img
                      alt="..."
                      className="w-5 mr-1"
                      src={require("assets/img/google.svg")}
                    />
                    Portis
                  </button>
                  </div>
                )}
                <hr className="mt-6 border-b-1 border-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Login.layout = Auth;
