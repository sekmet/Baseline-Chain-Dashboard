import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { ethers } from "ethers";
import { rpcServer } from "./rpc-server";
import { logger, reqLogger, reqErrorLogger } from "./logger";
import { dbConnect } from "./db";
import { merkleTrees } from "./db/models/MerkleTree";
import { contractBaseline } from "./db/models/Contract";
import { execShellTest, didIdentityManagerCreateIdentity, didGenerateDidConfiguration, didVerifyWellKnownDidConfiguration } from "./blockchain/did";
import { get_ws_provider, restartSubscriptions, deployContracts } from "./blockchain";

import * as fs from 'fs';
import * as path from 'path';

import { web3provider, wallet, txManager, waitRelayTx, deposit, getBalance } from "./blockchain/chain";

import * as shieldContract from "../artifacts/Shield.json";
import * as verifierContract from "../artifacts/VerifierNoop.json";

const saveEnv = async (settings: any) => {

  fs.writeFile(path.join(__dirname, "../../.env"), settings,  (err) => {
    if (err) {
        return logger.error(err);
    }
    logger.info(".env file created!");
  });

}

const saveContract = async (contractInfo: any) => {

  if (!contractInfo) {
    logger.error("No contract to save...");
    return false;
  }

  const newContract = new contractBaseline({
    name: contractInfo.contractName, // Contract name
    network: contractInfo.deployedNetwork, // Contract network
    blockNumber: contractInfo.lastBlock, // Last interation block number
    txHash: contractInfo.transactionHash, // Tx Hash
    address: contractInfo.contractAddress, // contract address
    active: contractInfo.isActive
  });

  await newContract.save((err) => {
    if (err) {
      logger.error(err);
      return false;
    }
    // saved!
    logger.info(`[ ${contractInfo.contractName} ] contract added to DB...`);
    return true;
  });

}

const deployVerifierContract = async (sender: string) => {
  let txHash;
  const nonce = await wallet.getTransactionCount();
  const unsignedTx = {
    from: sender,
    data: verifierContract.bytecode,
    nonce,
    gasLimit: 0
  }

  const gasEstimate = await wallet.estimateGas(unsignedTx);
  logger.debug(`gasEstimate: ${gasEstimate}`);
  unsignedTx.gasLimit = Math.ceil(Number(gasEstimate) * 1.1);
  logger.debug(`GasLimit: ${unsignedTx.gasLimit}`)

  const tx = await wallet.sendTransaction(unsignedTx);
  await tx.wait();
  txHash = tx.hash;

  return txHash;
}


const deployShieldContract = async (sender: string, verifierAddress: string, treeHeight: number) => {
  let txHash;
  const nonce = await wallet.getTransactionCount();
  const abiCoder = new ethers.utils.AbiCoder();
  // Encode the constructor parameters, then append to bytecode
  const encodedParams = abiCoder.encode(["address", "uint"], [verifierAddress, treeHeight]);
  const bytecodeWithParams = verifierContract.bytecode + encodedParams.slice(2).toString();
  const unsignedTx = {
    from: sender,
    data: bytecodeWithParams,
    nonce,
    gasLimit: 0
  };

  const gasEstimate = await wallet.estimateGas(unsignedTx);
  unsignedTx.gasLimit = Math.ceil(Number(gasEstimate) * 1.1);
  logger.debug(`gasEstimate: ${gasEstimate}`);
  const tx = await wallet.sendTransaction(unsignedTx);
  await tx.wait();
  txHash = tx.hash;

  return txHash;
}


const main = async () => {
  dotenv.config();
  const port = process.env.SERVER_PORT;

  logger.info("Starting commmitment manager server...");
  logger.debug(`shieldContract: ${shieldContract.contractName}`);
  logger.debug(`verifierContract: ${verifierContract.contractName}`)

  const dbUrl = 'mongodb://' +
    `${process.env.DATABASE_USER}` + ':' +
    `${process.env.DATABASE_PASSWORD}` + '@' +
    `${process.env.DATABASE_HOST}` + '/' +
    `${process.env.DATABASE_NAME}`;

  logger.debug(`Attempting to connect to db: ${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`)

  await dbConnect(dbUrl);
  await get_ws_provider(); // Establish websocket connection
  await restartSubscriptions(); // Enable event listeners for active MerkleTrees

  const app = express();

  // Set up a whitelist and check against it:
  /*var whitelist = ['http://localhost:3000', 'http://localhost:4001']
  var corsOptions = {
    origin: function (origin, callback) {
    8  if (whitelist.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  }*/

  app.use(reqLogger('COMMIT-MGR')); // Log requests
  app.use(reqErrorLogger('COMMIT-MGR')); // Log errors
  app.use(bodyParser.json({ limit: "2mb" })); // Pre-parse body content
  app.use(cors());

  app.get('/status', async (req: any, res: any) => {
    res.sendStatus(200);
  });


  /*app.get('/shell', async (req: any, res: any) => {

    const execInfo = req.body;

    if (!execInfo) {
      logger.error("No  command to execute...");
      return false;
    }
    // const result = await didGenerateDidConfiguration('autotoyz.open4g.com');
    // const result = await didGenerateDidConfiguration('{}');
    const result = await didVerifyWellKnownDidConfiguration('tailwindpower.netlify.app');

    res.send(result || {});
  });*/


  app.get('/did-generate', async (req: any, res: any) => {

    const execInfo = req.body;

    if (!execInfo) {
      logger.error("No  command to execute...");
      return false;
    }
    const result = await didGenerateDidConfiguration(execInfo.did, execInfo.domain);

    res.send(result || {});
  });


  app.get('/did-create-identity', async (req: any, res: any) => {

    const execInfo = '{}';

    if (!execInfo) {
      logger.error("No  command to execute...");
      return false;
    }
    const result = await didIdentityManagerCreateIdentity(execInfo);

    res.send(result || {});
  });


  app.get('/did-verify', async (req: any, res: any) => {

    const execInfo = req.body;

    if (!execInfo) {
      logger.error("No  command to execute...");
      return false;
    }
    const result = await didVerifyWellKnownDidConfiguration(execInfo.domain);

    res.send(result || {});
  });


  // api for get data from database
  app.get("/getmerkletrees", async (req: any, res: any) => {
    await merkleTrees.find({}, (err: any, data: any) => {
              if (err) {
                  res.send(err);
              } else {
                  res.send(data || {});
              }
          });
  });


  app.post("/deploy-shield-contract", async (req: any, res: any, next: any) => {

    const deployInfo = req.body;
    let txHash;

    if (!deployInfo) {
      logger.error("No contract to deploy...");
      return false;
    }

    logger.info(`Sender Address: ${deployInfo.sender}`);
    txHash = await deployShieldContract(deployInfo.sender, deployInfo.verifierAddress, 2);

    if (txHash)
      res.send(txHash || null)
    else
      res.send({message: "None contract to save..."})

  });


  app.post("/deploy-verifier-contract", async (req: any, res: any, next: any) => {

    const deployInfo = req.body;
    let txHash;

    if (!deployInfo) {
      logger.error("No contract to deploy...");
      return false;
    }

    logger.info(`Sender Address: ${deployInfo.sender}`);
    txHash = await deployVerifierContract(deployInfo.sender);

    if (txHash)
      res.send(txHash || null)
    else
      res.send({message: "None contract to save..."})

  });


  app.post("/deploy-contracts", async (req: any, res: any, next: any) => {

    const deployInfo = req.body;
    let contractsDeployed;

    if (!deployInfo) {
      logger.error("No contracts to deploy...");
      return false;
    }

    contractsDeployed = await deployContracts(deployInfo.sender, deployInfo.deployedNetwork);

    if (contractsDeployed)
      res.send(contractsDeployed || null)
    else
      res.send({message: "None contract to deploy..."})

  });


  app.post("/save-contract", async (req: any, res: any, next: any) => {

    const contractInfo = req.body;

    if (!contractInfo) {
      logger.error("No contract to save...");
      return false;
    }

    if (saveContract(contractInfo))
      res.sendStatus(200);
    else
    res.send({message: "None contract to save..."});

  });


  app.post("/save-settings", async (req: any, res: any, next: any) => {

    const settings = req.body;

    if (!settings) {
      logger.error("None settings to save...");
      return false;
    }

    saveEnv(`# Set to production when deploying to production
NODE_ENV="development"
LOG_LEVEL="debug"

# Node.js server configuration
SERVER_PORT=4001

# MongoDB configuration for the JS client
DATABASE_USER="${settings.DATABASE_USER}"
DATABASE_PASSWORD="${settings.DATABASE_PASSWORD}"
DATABASE_HOST="${settings.DATABASE_HOST}"
DATABASE_NAME="${settings.DATABASE_NAME}"

# Ethereum client
# "ganache": local, private ganache network
# "besu": local, private besu network
# "infura-gas": Infura's Managed Transaction (ITX) service
# "infura": Infura's traditional jsonrpc API
ETH_CLIENT_TYPE="${settings.ETH_CLIENT_TYPE}"

# Infura key
INFURA_ID="${settings.INFURA_ID}"

# Local client endpoints
# Websocket port
# 8545: ganache
# 8546: besu
ETH_CLIENT_WS="${settings.ETH_CLIENT_WS}"
ETH_CLIENT_HTTP="${settings.ETH_CLIENT_HTTP}"

# Chain ID
# 1: Mainnet
# 3: Ropsten
# 4: Rinkeby
# 5: Goerli
# 42: Kovan
# 101010: Custom network (private ganache or besu network)
CHAIN_ID=${settings.CHAIN_ID}

# Ethereum account key-pair. Do not use in production
WALLET_PRIVATE_KEY="${settings.WALLET_PRIVATE_KEY}"
WALLET_PUBLIC_KEY="${settings.WALLET_PUBLIC_KEY}"
`);
    res.sendStatus(200);
  });

  // Single endpoint to handle all JSON-RPC requests
  app.post("/jsonrpc", async (req: any, res: any, next: any) => {
    const context = {
      headers: req.headers,
      params: req.params,
      body: req.body,
      ipAddress:
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress,
    };

    await rpcServer.call(req.body, context, (err: any, result: any) => {
      if (err) {
        const errorMessage = err.error.data ? `${err.error.message}: ${err.error.data}` : `${err.error.message}`;
        logger.error(`Response error: ${errorMessage}`);
        res.send(err);
        return;
      }
      res.send(result || {});
    });
  });

  app.listen(port, () => {
    logger.info(`REST server listening on port ${port}.`);
  });
};

main();
