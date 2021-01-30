import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import { rpcServer } from "./rpc-server";
import { logger, reqLogger, reqErrorLogger } from "./logger";
import { dbConnect } from "./db";
import { merkleTrees } from "./db/models/MerkleTree";
import { get_ws_provider, restartSubscriptions } from "./blockchain";

import * as fs from 'fs';
import * as path from 'path';

const saveEnv = async (settings) => {

  fs.writeFile(path.join(__dirname, "../.env"), settings,  (err) => {
    if (err) {
        return logger.error(err);
    }
    logger.info(".env file created!");
  });

}

const main = async () => {
  dotenv.config();
  const port = process.env.SERVER_PORT;

  logger.info("Starting commmitment manager server...");

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

  app.post("/save-settings", async (req: any, res: any, next: any) => {

    const settings = req.body;

    if (!settings) {
      logger.error("No settings to save...");
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

  // api for get data from database
  app.get("/getdata", async (req: any, res: any) => {
    await merkleTrees.find({}, (err: any, data: any) => {
              if (err) {
                  res.send(err);
              } else {
                  res.send(data || {});
              }
          });
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
