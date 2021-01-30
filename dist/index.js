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
const rpc_server_1 = require("./rpc-server");
const logger_1 = require("./logger");
const db_1 = require("./db");
const MerkleTree_1 = require("./db/models/MerkleTree");
const blockchain_1 = require("./blockchain");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const saveEnv = (settings) => __awaiter(void 0, void 0, void 0, function* () {
    fs.writeFile(path.join(__dirname, "../.env"), settings, (err) => {
        if (err) {
            return logger_1.logger.error(err);
        }
        logger_1.logger.info(".env file created!");
    });
});
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    dotenv_1.default.config();
    const port = process.env.SERVER_PORT;
    logger_1.logger.info("Starting commmitment manager server...");
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
    app.post("/save-settings", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const settings = req.body;
        if (!settings) {
            logger_1.logger.error("No settings to save...");
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
    }));
    // api for get data from database
    app.get("/getdata", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        yield MerkleTree_1.merkleTrees.find({}, (err, data) => {
            if (err) {
                res.send(err);
            }
            else {
                res.send(data || {});
            }
        });
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