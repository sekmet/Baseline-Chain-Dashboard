"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const ethers_1 = require("ethers");
const rpc_server_1 = require("./rpc-server");
const logger_1 = require("./logger");
const db_1 = require("./db");
const MerkleTree_1 = require("./db/models/MerkleTree");
const Commitment_1 = require("./db/models/Commitment");
const Contract_1 = require("./db/models/Contract");
const Phonebook_1 = require("./db/models/Phonebook");
const did_1 = require("./blockchain/did");
const blockchain_1 = require("./blockchain");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chain_1 = require("./blockchain/chain");
const shieldContract = __importStar(require("../artifacts/Shield.json"));
const verifierContract = __importStar(require("../artifacts/VerifierNoop.json"));
const saveEnv = (settings, envfile) => __awaiter(void 0, void 0, void 0, function* () {
    fs.writeFile(path.join(__dirname, envfile), settings, (err) => {
        if (err) {
            return logger_1.logger.error(err);
        }
        logger_1.logger.info(".env file created!");
    });
});
const savePhonebookEntry = (entryInfo) => __awaiter(void 0, void 0, void 0, function* () {
    if (!entryInfo) {
        logger_1.logger.error("No domain to save...");
        return false;
    }
    const newPhonebook = new Phonebook_1.phonebookBaseline({
        name: entryInfo.name,
        network: entryInfo.network,
        domain: entryInfo.domain,
        dididentity: entryInfo.dididentity,
        status: entryInfo.status,
        active: true
    });
    yield newPhonebook.save((err) => {
        if (err) {
            logger_1.logger.error(err);
            return false;
        }
        // saved!
        logger_1.logger.info(`[ ${entryInfo.name} ] domain added to phonebook...`);
        return true;
    });
});
const saveCommiment = (commitInfo) => __awaiter(void 0, void 0, void 0, function* () {
    if (!commitInfo) {
        logger_1.logger.error("No commitment to save...");
        return false;
    }
    const newCommitment = new Commitment_1.commitmentBaseline({
        commitHash: commitInfo.commitHash,
        commitment: commitInfo.commitment,
        network: 'local' // always local network *TODO
    });
    yield newCommitment.save((err) => {
        if (err) {
            logger_1.logger.error(err);
            return false;
        }
        // saved!
        logger_1.logger.info(`[ ${newCommitment.commitment} ] commitment added to DB...`);
        return true;
    });
});
const saveContract = (contractInfo) => __awaiter(void 0, void 0, void 0, function* () {
    if (!contractInfo) {
        logger_1.logger.error("No contract to save...");
        return false;
    }
    const newContract = new Contract_1.contractBaseline({
        name: contractInfo.name,
        network: contractInfo.network,
        blockNumber: contractInfo.blockNumber,
        txHash: contractInfo.txHash,
        address: contractInfo.address,
        active: contractInfo.active
    });
    yield newContract.save((err) => {
        if (err) {
            logger_1.logger.error(err);
            return false;
        }
        // saved!
        logger_1.logger.info(`[ ${contractInfo.name} ] contract added to DB...`);
        return true;
    });
});
const deployVerifierContract = (sender, network) => __awaiter(void 0, void 0, void 0, function* () {
    let txHash;
    const nonce = yield chain_1.wallet.getTransactionCount();
    const unsignedTx = {
        from: sender,
        data: verifierContract.bytecode,
        nonce,
        gasLimit: 0
    };
    const gasEstimate = yield chain_1.wallet.estimateGas(unsignedTx);
    logger_1.logger.debug(`gasEstimate: ${gasEstimate}`);
    unsignedTx.gasLimit = Math.ceil(Number(gasEstimate) * 1.1);
    logger_1.logger.debug(`GasLimit: ${unsignedTx.gasLimit}`);
    const tx = yield chain_1.wallet.sendTransaction(unsignedTx);
    yield tx.wait();
    txHash = tx.hash;
    return txHash;
});
const deployShieldContract = (sender, verifierAddress, network, treeHeight) => __awaiter(void 0, void 0, void 0, function* () {
    let txHash;
    const nonce = yield chain_1.wallet.getTransactionCount();
    const abiCoder = new ethers_1.ethers.utils.AbiCoder();
    // Encode the constructor parameters, then append to bytecode
    const encodedParams = abiCoder.encode(["address", "uint"], [verifierAddress, treeHeight]);
    const bytecodeWithParams = verifierContract.bytecode + encodedParams.slice(2).toString();
    const unsignedTx = {
        from: sender,
        data: bytecodeWithParams,
        nonce,
        gasLimit: 0
    };
    const gasEstimate = yield chain_1.wallet.estimateGas(unsignedTx);
    unsignedTx.gasLimit = Math.ceil(Number(gasEstimate) * 1.1);
    logger_1.logger.debug(`gasEstimate: ${gasEstimate}`);
    const tx = yield chain_1.wallet.sendTransaction(unsignedTx);
    yield tx.wait();
    txHash = tx.hash;
    // sendFirstLeaf(sender, )
    return txHash;
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    dotenv_1.default.config();
    const port = process.env.SERVER_PORT;
    logger_1.logger.info("Starting commmitment manager server...");
    logger_1.logger.debug(`shieldContract: ${shieldContract.contractName}`);
    logger_1.logger.debug(`verifierContract: ${verifierContract.contractName}`);
    const dbUrl = 'mongodb://' +
        `${process.env.DATABASE_USER}` + ':' +
        `${process.env.DATABASE_PASSWORD}` + '@' +
        `${process.env.DATABASE_HOST}` + '/' +
        `${process.env.DATABASE_NAME}`;
    logger_1.logger.debug(`Attempting to connect to db: ${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`);
    yield db_1.dbConnect(dbUrl);
    yield blockchain_1.get_ws_provider(); // Establish websocket connection
    yield blockchain_1.restartSubscriptions(); // Enable event listeners for active MerkleTrees
    const app = express_1.default();
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
    app.use(logger_1.reqLogger('COMMIT-MGR')); // Log requests
    app.use(logger_1.reqErrorLogger('COMMIT-MGR')); // Log errors
    app.use(body_parser_1.default.json({ limit: "2mb" })); // Pre-parse body content
    app.use(cors_1.default());
    app.get('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        res.sendStatus(200);
    }));
    app.get('/network-mode', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        /*# Chain ID
        # 1: Mainnet
        # 3: Ropsten
        # 4: Rinkeby
        # 5: Goerli
        # 42: Kovan
        # 101010: Custom network (private ganache or besu network)*/
        let chainName;
        switch (parseInt(process.env.CHAIN_ID, 10)) {
            case 1:
                chainName = 'MAINNET';
                break;
            case 3:
                chainName = 'ROPSTEN';
                break;
            case 4:
                chainName = 'RINKEBY';
                break;
            case 5:
                chainName = 'GOERLI';
                break;
            case 42:
                chainName = 'KOVAN';
                break;
            case 101010:
                chainName = 'LOCAL';
                break;
            default:
                chainName = 'LOCAL';
                break;
        }
        const result = {
            chainId: process.env.CHAIN_ID,
            chainName,
            walletAddress: process.env.WALLET_PUBLIC_KEY,
            infuraId: process.env.INFURA_ID,
            commitServerPort: process.env.SERVER_PORT
        };
        res.send(result || {});
    }));
    app.get('/db-status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const result = {
            dbUrl: `${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`,
            dbHost: process.env.DATABASE_HOST
        };
        res.send(result || {});
    }));
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
    app.post('/switch-chain', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const execInfo = req.body;
        if (!execInfo) {
            logger_1.logger.error("No  command to execute...");
            return false;
        }
        // const result = await didGenerateDidConfiguration('autotoyz.open4g.com');
        // const result = await didGenerateDidConfiguration('{}');
        const result = yield blockchain_1.switchChain(execInfo.network);
        res.send(result || {});
    }));
    // api for get local commitments data from database
    app.get("/get-commiments", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield Commitment_1.commitmentBaseline.find({}, (err, data) => {
            if (err) {
                res.send(err);
            }
            else {
                res.send(data || {});
            }
        });
    }));
    app.post('/did-generate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const execInfo = req.body;
        if (!execInfo) {
            logger_1.logger.error("No  command to execute...");
            return false;
        }
        const result = yield did_1.didGenerateDidConfiguration(execInfo.did, execInfo.domain);
        res.send(result || {});
    }));
    app.post('/did-create-identity', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const execInfo = req.body ? req.body : '{}';
        if (!execInfo) {
            logger_1.logger.error("No  command to execute...");
            return false;
        }
        const result = yield did_1.didIdentityManagerCreateIdentity(execInfo.domain);
        res.send(result || {});
    }));
    app.post('/did-verify', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const execInfo = req.body;
        if (!execInfo) {
            logger_1.logger.error("No  command to execute...");
            return false;
        }
        const result = yield did_1.didVerifyWellKnownDidConfiguration(execInfo.domain);
        res.send(result || {});
    }));
    app.post('/add-phonebook', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const entryInfo = req.body;
        if (!entryInfo) {
            logger_1.logger.error("No domain to add...");
            return false;
        }
        const resultDid = JSON.parse(yield did_1.didVerifyWellKnownDidConfiguration(entryInfo.domain));
        const result = '';
        if (resultDid && resultDid.domain) {
            logger_1.logger.debug(resultDid);
            const phoneEntry = {
                name: resultDid.domain,
                network: resultDid.dids[0].split(':')[1] === 'key' ? '-key-' : resultDid.dids[0].split(':')[2],
                domain: resultDid.domain,
                dididentity: resultDid.dids[0],
                status: 'verified',
                active: true
            };
            yield savePhonebookEntry(phoneEntry);
            res.send(resultDid || {});
            return true;
        }
        res.send(result || {});
    }));
    // api for get merkle data from database
    app.get("/remove-phonebook/:entryId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield Phonebook_1.phonebookBaseline.deleteOne({ _id: req.params.entryId }, (err, data) => {
            if (err) {
                res.send(err);
            }
            else {
                res.send(data || {});
            }
        });
    }));
    // api for get merkle data from database
    app.get("/get-phonebook", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield Phonebook_1.phonebookBaseline.find({}, (err, data) => {
            if (err) {
                res.send(err);
            }
            else {
                res.send(data || {});
            }
        });
    }));
    // api for get merkle data from database
    app.get("/getmerkletrees", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield MerkleTree_1.merkleTrees.find({}, (err, data) => {
            if (err) {
                res.send(err);
            }
            else {
                res.send(data || {});
            }
        });
    }));
    app.get("/getmerkletree/:addressId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield MerkleTree_1.merkleTrees.findOne({ _id: req.params.addressId }, (err, data) => {
            if (err) {
                res.send(err);
            }
            else {
                res.send(data || {});
            }
        });
    }));
    // delete db merkletree for a specific contract info from database
    app.post("/delete-merkletree", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield MerkleTree_1.merkleTrees.deleteOne({ _id: req.params.addressId }, (err, data) => {
            if (err) {
                res.send(err);
            }
            else {
                res.send(data || {});
            }
        });
    }));
    // delete db contract info from database
    app.post("/reset-merkletree", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield MerkleTree_1.merkleTrees.deleteMany({}, (err, data) => {
            if (err) {
                res.send(err);
            }
            else {
                res.send(data || {});
            }
        });
    }));
    // delete db contract info from database
    app.post("/reset-contracts", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield Commitment_1.commitmentBaseline.deleteMany({}, (err, data) => {
            if (err) {
                logger_1.logger.error(err);
            }
            else {
                logger_1.logger.debug(data || {});
            }
        });
        yield MerkleTree_1.merkleTrees.deleteMany({}, (err, data) => {
            if (err) {
                logger_1.logger.error(err);
            }
            else {
                logger_1.logger.debug(data || {});
            }
        });
        yield Contract_1.contractBaseline.deleteMany({}, (err, data) => {
            if (err) {
                res.send(err);
            }
            else {
                res.send(data || {});
            }
        });
    }));
    // api for get contracts data from database
    app.get("/contracts-available", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield Contract_1.contractBaseline.find({}, (err, data) => {
            if (err) {
                res.send(err);
            }
            else {
                res.send(data || {});
            }
        });
    }));
    // api for get contracts data from database
    app.get("/contracts-local", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield Contract_1.contractBaseline.find({ network: 'local' }, (err, data) => {
            if (err) {
                res.send(err);
            }
            else {
                res.send(data || {});
            }
        });
    }));
    // api for get contracts data from database
    app.get("/contracts/:networkId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield Contract_1.contractBaseline.find({ network: req.params.networkId }, (err, data) => {
            if (err) {
                res.send(err);
            }
            else {
                res.send(data || {});
            }
        });
    }));
    app.post("/send-commit", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const deployInfo = req.body;
        let txHash;
        if (!deployInfo) {
            logger_1.logger.error("No commit found...");
            return false;
        }
        logger_1.logger.info(`Sender Address: ${deployInfo.sender}`);
        logger_1.logger.info(`Shield Contract Address: ${deployInfo.shieldAddress}`);
        logger_1.logger.info(`New Commitment Sent: ${deployInfo.newCommitment}`);
        // await sendBaselineTrack(deployInfo.shieldAddress, deployInfo.network);
        // const shieldTracked = await sendBaselineGetTracked();
        // if (shieldTracked)
        //  logger.info(`Shield Contract Tracked: ${shieldTracked}`);
        // txHash = await sendBaselineVerifyAndPush(deployInfo.sender, deployInfo.shieldAddress, deployInfo.network);
        txHash = yield blockchain_1.sendCommit(deployInfo.newCommitment, deployInfo.sender, deployInfo.shieldAddress, deployInfo.network, saveCommiment);
        if (txHash)
            res.send(txHash || null);
        else
            res.send({ message: "Could not retreive commit from blockchain..." });
    }));
    app.post("/send-first-commit", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const deployInfo = req.body;
        let txHash;
        if (!deployInfo) {
            logger_1.logger.error("No commit found...");
            return false;
        }
        logger_1.logger.info(`Sender Address: ${deployInfo.sender}`);
        logger_1.logger.info(`Shield Contract Address: ${deployInfo.shieldAddress}`);
        // await sendBaselineTrack(deployInfo.shieldAddress, deployInfo.network);
        // const shieldTracked = await sendBaselineGetTracked();
        // if (shieldTracked)
        //  logger.info(`Shield Contract Tracked: ${shieldTracked}`);
        // txHash = await sendBaselineVerifyAndPush(deployInfo.sender, deployInfo.shieldAddress, deployInfo.network);
        txHash = yield blockchain_1.sendCommit(deployInfo.sender, deployInfo.shieldAddress, deployInfo.network);
        if (txHash)
            res.send(txHash || null);
        else
            res.send({ message: "Could not retreive commit from blockchain..." });
    }));
    app.post("/run-tests", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const deployInfo = req.body;
        let txHash;
        if (!deployInfo) {
            logger_1.logger.error("No params found...");
            return false;
        }
        logger_1.logger.info(`Sender Address: ${deployInfo.sender}`);
        logger_1.logger.info(`Shield Contract Address: ${deployInfo.shieldAddress}`);
        logger_1.logger.info(`Verifier Contract Address: ${deployInfo.verifierAddress}`);
        // await sendBaselineTrack(deployInfo.shieldAddress, deployInfo.network);
        // const shieldTracked = await sendBaselineGetTracked();
        // if (shieldTracked)
        //  logger.info(`Shield Contract Tracked: ${shieldTracked}`);
        // txHash = await sendBaselineVerifyAndPush(deployInfo.sender, deployInfo.shieldAddress, deployInfo.network);
        // txHash = await sendFirstLeaf(deployInfo.sender, deployInfo.shieldAddress, deployInfo.network);
        txHash = yield blockchain_1.runTests(deployInfo.sender, deployInfo.verifierAddress, deployInfo.network, saveContract);
        if (txHash)
            res.send(txHash || null);
        else
            res.send({ message: "Could not run tests..." });
    }));
    app.post("/deploy-shield-contract", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const deployInfo = req.body;
        let txHash;
        if (!deployInfo) {
            logger_1.logger.error("No contract to deploy...");
            return false;
        }
        logger_1.logger.info(`Sender Address: ${deployInfo.sender}`);
        txHash = yield deployShieldContract(deployInfo.sender, deployInfo.verifierAddress, deployInfo.network, 2);
        if (txHash)
            res.send(txHash || null);
        else
            res.send({ message: "None contract to save..." });
    }));
    app.post("/deploy-verifier-contract", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const deployInfo = req.body;
        let txHash;
        if (!deployInfo) {
            logger_1.logger.error("No contract to deploy...");
            return false;
        }
        logger_1.logger.info(`Sender Address: ${deployInfo.sender}`);
        txHash = yield deployVerifierContract(deployInfo.sender, deployInfo.network);
        if (txHash)
            res.send(txHash || null);
        else
            res.send({ message: "None contract to save..." });
    }));
    app.post("/deploy-contracts", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const deployInfo = req.body;
        let contractsDeployed;
        if (!deployInfo) {
            logger_1.logger.error("No contracts to deploy...");
            return false;
        }
        if (!deployInfo.sender) {
            deployInfo.sender = process.env.WALLET_PUBLIC_KEY;
        }
        contractsDeployed = yield blockchain_1.deployContracts(deployInfo.sender, undefined, deployInfo.network, saveContract, saveCommiment);
        if (contractsDeployed)
            res.send(contractsDeployed || null);
        else
            res.send({ message: "None contract to deploy..." });
    }));
    app.post("/save-contract", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const contractInfo = req.body;
        if (!contractInfo) {
            logger_1.logger.error("No contract to save...");
            return false;
        }
        if (saveContract(contractInfo))
            res.sendStatus(200);
        else
            res.send({ message: "None contract to save..." });
    }));
    app.post("/save-settings", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const settings = req.body;
        if (!settings) {
            logger_1.logger.error("None settings to save...");
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
ETH_CLIENT_TYPE="${settings.LOCAL_ETH_CLIENT_TYPE}"

# Local client endpoints
# Websocket port
# 8545: ganache
# 8546: besu
ETH_CLIENT_WS="${settings.LOCAL_ETH_CLIENT_WS}"
ETH_CLIENT_HTTP="${settings.LOCAL_ETH_CLIENT_HTTP}"

# Chain ID
# 1: Mainnet
# 3: Ropsten
# 4: Rinkeby
# 5: Goerli
# 42: Kovan
# 101010: Custom network (private ganache or besu network)
CHAIN_ID=${settings.LOCAL_CHAIN_ID}

# Ethereum account key-pair. Do not use in production
WALLET_PRIVATE_KEY="${settings.LOCAL_WALLET_PRIVATE_KEY}"
WALLET_PUBLIC_KEY="${settings.LOCAL_WALLET_PUBLIC_KEY}"
`, "../../.env");
        // ##################### LIVE DEV
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
ETH_CLIENT_TYPE="${settings.LOCAL_ETH_CLIENT_TYPE}"

# Local client endpoints
# Websocket port
# 8545: ganache
# 8546: besu
ETH_CLIENT_WS="${settings.LOCAL_ETH_CLIENT_WS}"
ETH_CLIENT_HTTP="${settings.LOCAL_ETH_CLIENT_HTTP}"

# Chain ID
# 1: Mainnet
# 3: Ropsten
# 4: Rinkeby
# 5: Goerli
# 42: Kovan
# 101010: Custom network (private ganache or besu network)
CHAIN_ID=${settings.LOCAL_CHAIN_ID}

# Ethereum account key-pair. Do not use in production
WALLET_PRIVATE_KEY="${settings.LOCAL_WALLET_PRIVATE_KEY}"
WALLET_PUBLIC_KEY="${settings.LOCAL_WALLET_PUBLIC_KEY}"
`, "../../.env.localdev");
        // ##################### LIVE ENV
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
`, "../../.env.network");
        res.sendStatus(200);
    }));
    // Single endpoint to handle all JSON-RPC requests
    app.post("/jsonrpc", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const context = {
            headers: req.headers,
            params: req.params,
            body: req.body,
            ipAddress: req.headers["x-forwarded-for"] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress,
        };
        yield rpc_server_1.rpcServer.call(req.body, context, (err, result) => {
            if (err) {
                const errorMessage = err.error.data ? `${err.error.message}: ${err.error.data}` : `${err.error.message}`;
                logger_1.logger.error(`Response error: ${errorMessage}`);
                res.send(err);
                return;
            }
            res.send(result || {});
        });
    }));
    app.listen(port, () => {
        logger_1.logger.info(`REST server listening on port ${port}.`);
    });
});
main();
//# sourceMappingURL=index.js.map