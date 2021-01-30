import React from "react";
import axios from 'axios';
//import { useWallet } from 'use-wallet';

const get_chain_id_info = (chainId) => {
  /* # Chain ID */
  let result;

  switch (parseInt(chainId)) {
     /* # 1: Mainnet*/
    case 1: {
      result = { ws_provider: "wss://mainnet.infura.io/ws/v3/", http_provider: "https://mainnet.infura.io/v3/" }
      break;
    }
    /* # 3: Ropsten*/  
    case 3: {
      result = { ws_provider: "wss://ropsten.infura.io/ws/v3/", http_provider: "https://ropsten.infura.io/v3/" }
      break;
    }     
    /* # 4: Rinkeby*/
    case 4: {
      result = { ws_provider: "wss://rinkeby.infura.io/ws/v3/", http_provider: "https://rinkeby.infura.io/v3/" }
      break;
    }
    /* # 5: Goerli*/   
    case 5: {
      result = { ws_provider: "wss://goerli.infura.io/ws/v3/", http_provider: "https://goerli.infura.io/v3/" }
      break;
    }
    /* # 42: Kovan*/  
    case 42: {
      result = { ws_provider: "wss://kovan.infura.io/ws/v3/", http_provider: "https://kovan.infura.io/v3/" }
      break;
    }
    /* # 101010: Custom network (private ganache or besu network)*/           
    case 101010: {
      result = { ws_provider: "ws://localhost:", http_provider: "http://localhost:" }
      break;
    }
  }
  
  return result;
}

const getEthClientInfo = (ethClientType, chainId, infuraId) => {

  // get chain information to connect
  const chain_info = get_chain_id_info(chainId);

  //console.log("chain_inf  ", chain_info)

  let eth_client_ws;
  let eth_client_http;
  let result;

  /* # Ethereum client */
  switch (ethClientType) {
    case "infura": {
      eth_client_ws = `${chain_info.ws_provider}${infuraId}`;
      eth_client_http = `${chain_info.http_provider}${infuraId}`;   
      //logger.info("infura: Infura's traditional jsonrpc API");
      result = { ws_provider: eth_client_ws, http_provider: eth_client_http };
      break; 
    }       
    case "infura-gas": {
      eth_client_ws = `${chain_info.ws_provider}${infuraId}`;
      eth_client_http = `${chain_info.http_provider}${infuraId}`;      
      //logger.info("infura: Infura's Managed Transaction (ITX) service");
      result = { ws_provider: eth_client_ws, http_provider: eth_client_http };
      break;
    }     
    case "ganache": {
      eth_client_ws = `${chain_info.ws_provider}${8545}`;
      eth_client_http = `${chain_info.http_provider}${8545}`;
      //logger.info("ganache: local, private ganache network");
      result = { ws_provider: eth_client_ws, http_provider: eth_client_http };
      break;
    }
    case "besu": {
      eth_client_ws = `${chain_info.ws_provider}${8546}`;
      eth_client_http = `${chain_info.http_provider}${8545}`;
      //logger.info("besu: local, private besu network");
      result = { ws_provider: eth_client_ws, http_provider: eth_client_http };
      break; 
    }
    default: {
      console.error(`Sorry, this client is not supported: ${expr}.`);
      break;
    }
  }

  return result;

}


// components
export default class FormSettings extends React.Component {

  //const wallet = useWallet();  
  constructor(props) {
    super(props);

    const { 
        NodeEnv, 
        LogLevel, 
        ServerPort, 
        DatabaseUser, 
        DatabaseName, 
        DatabasePassword, 
        DatabaseHost, 
        EthClientType, 
        InfuraId, 
        EthClientWs, 
        EthClientHttp,
        ChainId, 
        WalletPrivateKey, 
        WalletPublicKey 
        } = props;
        
        console.log('PROPS == ', props)

        this.state = {
            NODE_ENV: NodeEnv ? NodeEnv : "development",
            LOG_LEVEL: LogLevel ? LogLevel : "debug",
            SERVER_PORT: ServerPort ? ServerPort : "4001",
            DATABASE_USER: DatabaseUser ? DatabaseUser : "admin", 
            DATABASE_NAME: DatabaseName ? DatabaseName : "baseline", 
            DATABASE_PASSWORD: DatabasePassword ? DatabasePassword : "password123", 
            DATABASE_HOST: DatabaseHost ? DatabaseHost : "localhost:27017",
            ETH_CLIENT_TYPE: EthClientType ? EthClientType : "besu",
            INFURA_ID: (EthClientType === "besu" || EthClientType === "ganache") ? "" : InfuraId,
            ETH_CLIENT_WS: EthClientWs ? EthClientWs : "http://localhost:8546",
            ETH_CLIENT_HTTP: EthClientHttp ? EthClientHttp : "http://localhost:8545",
            CHAIN_ID: (EthClientType === "besu" || EthClientType === "ganache") ? 101010 : ChainId,
            WALLET_PRIVATE_KEY: WalletPrivateKey ? WalletPrivateKey : "0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f",
            WALLET_PUBLIC_KEY: WalletPublicKey ? WalletPublicKey : "0xf17f52151EbEF6C7334FAD080c5704D77216b732",
            errorLabel: "",
            status: "",
            errorLabelHidden: true
        };
    }


    onChange = (e) => {
        // Because we named the inputs to match their corresponding values in state, it's
        // super easy to update the state
        //console.log(`${e.target.name} = ${e.target.value}`);
        this.setState({[e.target.name]: e.target.value});
    }

    
    onSubmit = (e) => {
        e.preventDefault();
        // get our form data out of state
        const {
            NODE_ENV,
            LOG_LEVEL,
            SERVER_PORT,
            DATABASE_USER, 
            DATABASE_NAME,
            DATABASE_PASSWORD, 
            DATABASE_HOST,
            ETH_CLIENT_TYPE,
            INFURA_ID,
            ETH_CLIENT_WS,
            ETH_CLIENT_HTTP,
            CHAIN_ID,
            WALLET_PRIVATE_KEY,
            WALLET_PUBLIC_KEY,
            errorLabel,
            status
        } = this.state;

        const clientConfig = getEthClientInfo(ETH_CLIENT_TYPE, CHAIN_ID, INFURA_ID);
        const { ws_provider , http_provider } = clientConfig;
        //console.log('clientConfig   ', clientConfig)

        axios.post('http://api.baseline.test/save-settings', {
            DATABASE_USER: DATABASE_USER,
            DATABASE_NAME: DATABASE_NAME,
            DATABASE_PASSWORD: DATABASE_PASSWORD, 
            DATABASE_HOST: DATABASE_HOST,
            ETH_CLIENT_TYPE: ETH_CLIENT_TYPE,
            INFURA_ID: INFURA_ID,
            ETH_CLIENT_WS: ws_provider ? ws_provider : ETH_CLIENT_WS,
            ETH_CLIENT_HTTP: http_provider ? http_provider : ETH_CLIENT_HTTP,
            CHAIN_ID: (ETH_CLIENT_TYPE === 'besu' || ETH_CLIENT_TYPE === 'ganache') ? 101010 : CHAIN_ID,
            WALLET_PRIVATE_KEY: WALLET_PRIVATE_KEY,
            WALLET_PUBLIC_KEY: WALLET_PUBLIC_KEY
            })
            .then((response) => {
                //access the resp here....
                var payload = response.statusText;
                console.log(`Settings saved: ${payload}`);
                this.setState({
                    NODE_ENV: "development",
                    LOG_LEVEL: "debug",
                    SERVER_PORT: "4001",
                    DATABASE_USER: DATABASE_USER,
                    DATABASE_NAME: DATABASE_NAME,
                    DATABASE_PASSWORD: DATABASE_PASSWORD, 
                    DATABASE_HOST: DATABASE_HOST,
                    ETH_CLIENT_TYPE: ETH_CLIENT_TYPE,
                    INFURA_ID: INFURA_ID,
                    ETH_CLIENT_WS: ws_provider ? ws_provider : ETH_CLIENT_WS,
                    ETH_CLIENT_HTTP: http_provider ? http_provider : ETH_CLIENT_HTTP,
                    CHAIN_ID: CHAIN_ID,
                    WALLET_PRIVATE_KEY: WALLET_PRIVATE_KEY,
                    WALLET_PUBLIC_KEY: WALLET_PUBLIC_KEY,
                    status: payload,
                    errorLabelHidden: true
                });

            })
            .catch((error) => {
                console.log(error);
                this.setState({
                    errorLabelHidden: false,
                    errorLabel: "OOPS that didn't work :(",
                    status: "ERROR"
                });
            });
    }

    render() {

        const {
            NODE_ENV,
            LOG_LEVEL,
            SERVER_PORT,
            DATABASE_USER, 
            DATABASE_NAME, 
            DATABASE_PASSWORD, 
            DATABASE_HOST,
            ETH_CLIENT_TYPE,
            INFURA_ID,
            ETH_CLIENT_WS,
            ETH_CLIENT_HTTP,
            CHAIN_ID,
            WALLET_PRIVATE_KEY,
            WALLET_PUBLIC_KEY,
            errorLabel
        } = this.state;

        //console.log({...this.state})

        if (!this.state) return false;

        return (
            <>
            <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-gray-200 border-0">
            <form onSubmit={this.onSubmit}>
                <div className="rounded-t bg-white mb-0 px-6 py-6">
                <div className="text-center flex justify-between">
                    <h6 className="text-gray-800 text-xl font-bold">Baseline Commmitment Manager Settings</h6>
                    <button
                    className="bg-gray-800 active:bg-green-700 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                    type="submit"
                    >
                    Save Settings
                    </button>
                </div>
                </div>
                <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
                    <h6 className="text-gray-500 text-sm mt-3 mb-6 font-bold uppercase">
                    Database Information
                    </h6>
                    <div className="flex flex-wrap">
                    <div className="w-full lg:w-6/12 px-4">
                        <div className="relative w-full mb-3">
                        <label
                            className="block uppercase text-gray-700 text-xs font-bold mb-2"
                            htmlFor="grid-password"
                        >
                            DATABASE USER
                        </label>
                        <input
                            type="text"
                            name="DATABASE_USER"
                            value={DATABASE_USER} 
                            onChange={this.onChange}
                            className="px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"
                        />
                        </div>
                    </div>
                    <div className="w-full lg:w-6/12 px-4">
                        <div className="relative w-full mb-3">
                        <label
                            className="block uppercase text-gray-700 text-xs font-bold mb-2"
                            htmlFor="grid-password"
                        >
                            DATABASE PASSWORD
                        </label>
                        <input
                            name="DATABASE_PASSWORD"
                            value={DATABASE_PASSWORD} 
                            onChange={this.onChange}                        
                            type="password"
                            className="px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"
                        />
                        </div>
                    </div>
                    <div className="w-full lg:w-6/12 px-4">
                        <div className="relative w-full mb-3">
                        <label
                            className="block uppercase text-gray-700 text-xs font-bold mb-2"
                            htmlFor="grid-password"
                        >
                            DATABASE HOST
                        </label>
                        <input
                            name="DATABASE_HOST"
                            value={DATABASE_HOST} 
                            onChange={this.onChange}                        
                            type="text"
                            className="px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"
                        />
                        </div>
                    </div>
                    <div className="w-full lg:w-6/12 px-4">
                        <div className="relative w-full mb-3">
                        <label
                            className="block uppercase text-gray-700 text-xs font-bold mb-2"
                            htmlFor="grid-password"
                        >
                            DATABASE NAME
                        </label>
                        <input
                            name="DATABASE_NAME"
                            value={DATABASE_NAME} 
                            onChange={this.onChange}                        
                            type="text"
                            className="px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"
                        />
                        </div>
                    </div>
                    </div>

                    <hr className="mt-6 border-b-1 border-gray-400" />

                    <h6 className="text-gray-500 text-sm mt-3 mb-6 font-bold uppercase">
                    Ethereum Client Information
                    </h6>
                    <div className="flex flex-wrap">
                    <div className="w-full lg:w-6/12 px-4">
                        <div className="relative w-full mb-3">
                        <label
                            className="block uppercase text-gray-700 text-xs font-bold mb-2"
                            htmlFor="grid-password"
                        >
                            ETHEREUM CLIENT TYPE
                        </label>
                        <select name="ETH_CLIENT_TYPE" value={ETH_CLIENT_TYPE} onChange={this.onChange} className="form-select block px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150">
                            <option value="infura">Infura</option>
                            <option value="infura-gas">Infura-Gas</option>
                            <option value="besu">Besu</option>
                            <option value="ganache">Ganache</option>
                        </select>
                        </div>
                    </div>
                    <div className="w-full lg:w-6/12 px-4">
                        <div className="relative w-full mb-3">
                        <label
                            className="block uppercase text-gray-700 text-xs font-bold mb-2"
                            htmlFor="grid-password"
                        >
                            INFURA ID
                        </label>
                        <input
                            disabled={ETH_CLIENT_TYPE === 'besu' || ETH_CLIENT_TYPE === 'ganache' ? 'disabled' : ''}
                            name="INFURA_ID"
                            value={ETH_CLIENT_TYPE === 'besu' || ETH_CLIENT_TYPE === 'ganache' ? '' : INFURA_ID} 
                            onChange={this.onChange}                        
                            type="text"
                            className={ETH_CLIENT_TYPE === 'besu' || ETH_CLIENT_TYPE === 'ganache' ? "px-3 py-3 placeholder-gray-400 text-gray-700 bg-gray-300 rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150" : "px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"}
                        />
                        </div>
                    </div>
                    <div className="w-full lg:w-12/12 px-4">
                        <div className="relative w-full mb-3">
                        <label
                            className="block uppercase text-gray-700 text-xs font-bold mb-2"
                            htmlFor="grid-password"
                        >
                            CHAIN ID
                        </label>
                        <select 
                            name="CHAIN_ID" 
                            value={ETH_CLIENT_TYPE === 'besu' || ETH_CLIENT_TYPE === 'ganache' ? 101010 : CHAIN_ID} 
                            disabled={ETH_CLIENT_TYPE === 'besu' || ETH_CLIENT_TYPE === 'ganache' ? 'disabled' : ''}
                            onChange={this.onChange} 
                            className={ETH_CLIENT_TYPE === 'besu' || ETH_CLIENT_TYPE === 'ganache' ? "form-select block px-3 py-3 placeholder-gray-400 text-gray-700 bg-gray-300 rounded shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150" : "form-select block px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"}
                            >
                            <option value="1">Mainnet (1)</option>
                            <option value="3">Ropsten (3)</option>
                            <option value="5">Goerli (5)</option>
                            <option value="42">Kovan (42)</option>
                            <option value="101010">Ganache or Besu (101010)</option>
                        </select>
                        <input
                            name="ETH_CLIENT_WS" 
                            type="hidden"
                            value={ETH_CLIENT_WS}
                        />
                        <input
                            name="ETH_CLIENT_HTTP" 
                            type="hidden"
                            value={ETH_CLIENT_WS}
                        />                        
                        </div>
                    </div>
                    {/*<div className="w-full lg:w-2/12 px-4">
                        <div className="relative w-full mb-3">
                        <label
                            className="block uppercase text-gray-700 text-xs font-bold mb-2"
                            htmlFor="grid-password"
                        >
                            CHAIN ID
                        </label>
                        <input
                            type="number"
                            className="px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"
                            defaultValue={wallet.chainId}
                        />
                        </div>
                    </div>*/}          
                    </div>

                    <hr className="mt-6 border-b-1 border-gray-400" />

                    <h6 className="text-gray-500 text-sm mt-3 mb-6 font-bold uppercase">
                    Wallet / DID Identity
                    </h6>
                    <div className="flex flex-wrap">
                    <div className="w-full lg:w-12/12 px-4">
                        <div className="relative w-full mb-3">
                        <label
                            className="block uppercase text-gray-700 text-xs font-bold mb-2"
                            htmlFor="grid-password"
                        >
                            WALLET PRIVATE KEY
                        </label>
                        <input
                            name="WALLET_PRIVATE_KEY" 
                            value={WALLET_PRIVATE_KEY} 
                            onChange={this.onChange}
                            type="text"
                            className="px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"
                        />
                        </div>
                    </div>
                    <div className="w-full lg:w-12/12 px-4">
                        <div className="relative w-full mb-3">
                        <label
                            className="block uppercase text-gray-700 text-xs font-bold mb-2"
                            htmlFor="grid-password"
                        >
                            WALLET PUBLIC KEY
                        </label>
                        <input
                            name="WALLET_PUBLIC_KEY" 
                            value={WALLET_PUBLIC_KEY} 
                            onChange={this.onChange}
                            type="text"
                            className="px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"
                        />
                        </div>
                    </div>
                    <div className="w-full lg:w-12/12 px-4">
                        <div className="relative w-full mb-3">
                        <label
                            className="block uppercase text-gray-700 text-xs font-bold mb-2"
                            htmlFor="grid-password"
                        >
                            DID Identity
                        </label>
                        <textarea
                            type="text"
                            className="px-3 py-3 placeholder-gray-400 text-gray-700 bg-white rounded text-sm shadow focus:outline-none focus:shadow-outline w-full ease-linear transition-all duration-150"
                            rows="9"
                            defaultValue={`{"@context": "https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld", "linked_dids": ["eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJ2YyI6eyJjcmVkZW50aWFsU3ViamVjdCI6eyJvcmlnaW4iOiJ0YWlsd2luZHBvd2VyLm5ldGxpZnkuYXBwIn0sIkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIiwiaHR0cHM6Ly9pZGVudGl0eS5mb3VuZGF0aW9uLy53ZWxsLWtub3duL2NvbnRleHRzL2RpZC1jb25maWd1cmF0aW9uLXYwLjAuanNvbmxkIl0sInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiLCJEb21haW5MaW5rYWdlQ3JlZGVudGlhbCJdfSwic3ViIjoiZGlkOmV0aHI6Z29lcmxpOjB4NDBkOWMzYWU2ODhhNmY0MGRmMzgyY2VmNzU1ZjU5OTFhNTQ4OWE2OSIsIm5iZiI6MTYxMTc3ODcyOSwiaXNzIjoiZGlkOmV0aHI6Z29lcmxpOjB4NDBkOWMzYWU2ODhhNmY0MGRmMzgyY2VmNzU1ZjU5OTFhNTQ4OWE2OSJ9.bpuXYwptwCrje3D1c1dBc8jsIcsVJaj5pUlPp1r_hP2cggbxhKcH0tvRXnaRn8d8WgDKQ3iOW2adv2Q0vsxttw"] }`}
                        ></textarea>
                        </div>
                    </div>
                    </div>
                </div>
                </form>
            </div>
            </>
        );

    }
}
