import { ethers, Wallet } from "ethers";
import axios from 'axios';
import { logger } from "../logger";
import dotenv from "dotenv";

dotenv.config();

const commitMgrEndpoint = "http://api.baseline.test/jsonrpc";

export const web3provider = new ethers.providers.JsonRpcProvider(commitMgrEndpoint);
export const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, web3provider);
export const txManager = process.env.ETH_CLIENT_TYPE;

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const waitRelayTx = async function (relayTxHash) {
  let mined = false
  while (!mined) {
    const statusResponse = await web3provider.send('relay_getTransactionStatus', [
      relayTxHash
    ]);

    for (let i = 0; i < statusResponse.length; i++) {
      const hashes = statusResponse[i]
      const receipt = await web3provider.getTransactionReceipt(hashes.ethTxHash)
      if (receipt && receipt.confirmations && receipt.confirmations > 1) {
        mined = true
        return receipt
      }
    }
    await sleep(1000)
  }
}

export const deposit = async function () {
  const tx = await wallet.sendTransaction({
    // This is the ITX PaymentDeposit contract address for Rinkeby
    //to: '0x015C7C7A7D65bbdb117C573007219107BD7486f9',
    // This is the ITX PaymentDeposit contract address for Goerli
    to: '0xE25118a1d97423c5a5454c43C5013dd169de2518',
    // Choose how much ether you want to deposit in the ITX gas tank
    value: ethers.utils.parseUnits('1.0', 'ether')
  })

  // Waiting for the transaction to be mined
  await tx.wait()
}

export const getBalance = async function () {
  const balance = await web3provider.send('relay_getBalance', [wallet.address]);
  return balance;
}

export const deployContracts = async (senderAddress, network) => {
  
  //################ Deploy Verifier Contract
  let contractInfo;
  const verifierAddress = await axios.post('http://api.baseline.test/deploy-verifier-contract', {
      contractName: "Verifier.sol",
      deployedNetwork: network,
      sender: senderAddress
    })
    .then( (response) => {
        //access the resp here....
        logger.debug(`Deploy: ${response.data}`);
        return response.data;
    })
    .then (async (txHash) => {
      logger.debug(`Tx Hash: ${txHash}`);
      return await axios.post(process.env.ETH_CLIENT_HTTP, {
        jsonrpc: "2.0",
        method: "eth_getTransactionReceipt",
        params: [txHash],
        id: 1
      })
      .then( (eth_response) => {
        //access the resp here....
      const result = eth_response.data;
      //Alert('success', 'Settings saved...', 'Settings saved with success into .env file..');
      logger.info(`Verifier Contract Address: ${result.result.contractAddress}`);

      contractInfo = {
          name: 'Verifier.sol', // Contract name
          network: network, // Contract network
          blockNumber: result.result.blockNumber, // Last interation block number
          txHash: txHash, // Tx Hash
          address: result.result.contractAddress, // contract address
          active: true
      }
      
      return result.result.contractAddress;
    })
    .catch((error) => {
      logger.error(error);
      //Alert('error', 'ERROR...', "OOPS that didn't work :(");
    });

    })
    .catch((error) => {
        logger.error(error);
        //Alert('error', 'ERROR...', "OOPS that didn't work :(");
    });

  //############# Deploy Shield Contract
  await axios.post('http://api.baseline.test/deploy-shield-contract', {
    contractName: "Shield.sol",
    deployedNetwork: network,
    verifierAddress: verifierAddress,
    sender: senderAddress
  })
  .then( (response) => {
      //access the resp here....
      logger.debug(`Deploy: ${response.data}`);
      return response.data;
  })
  .then (async (txHash) => {
    logger.debug(`Tx Hash: ${txHash}`);
    return await axios.post(process.env.ETH_CLIENT_HTTP, {
      jsonrpc: "2.0",
      method: "eth_getTransactionReceipt",
      params: [txHash],
      id: 1
    })
    .then( (eth_response) => {
      //access the resp here....
    const result = eth_response.data;
    //Alert('success', 'Settings saved...', 'Settings saved with success into .env file..');
    logger.info(`Shield Contract Address: ${result.result.contractAddress}`);
    return result.result;
  })
  .catch((error) => {
    logger.error(error);
    //Alert('error', 'ERROR...', "OOPS that didn't work :(");
  });

  })
  .catch((error) => {
      logger.error(error);
      //Alert('error', 'ERROR...', "OOPS that didn't work :(");
  });

  return true;
}
