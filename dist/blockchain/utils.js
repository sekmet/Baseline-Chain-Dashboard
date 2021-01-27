"use strict";
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
exports.jsonrpc = exports.checkChainLogs = exports.restartSubscriptions = exports.get_ws_provider = exports.http_provider = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const ethers_1 = require("ethers");
const logger_1 = require("../logger");
const leaves_1 = require("../merkle-tree/leaves");
const MerkleTree_1 = require("../db/models/MerkleTree");
const shield_contract_1 = require("./shield-contract");
const events_1 = require("./events");
dotenv_1.default.config();
let ws_provider;
exports.http_provider = new ethers_1.ethers.providers.JsonRpcProvider(process.env.ETH_CLIENT_HTTP);
exports.get_ws_provider = () => {
    if (!ws_provider) {
        try {
            ws_provider = new ethers_1.ethers.providers.WebSocketProvider(process.env.ETH_CLIENT_WS);
            ws_provider._websocket.on("error", (error) => {
                logger_1.logger.error(`[WEBSOCKET] "error" event: ${error.stack}`);
                ws_provider = undefined;
            });
            ws_provider._websocket.on("close", (event) => {
                logger_1.logger.error(`[WEBSOCKET] "close" event: ${event}`);
                ws_provider = undefined;
            });
            logger_1.logger.info(`Established websocket connection: ${process.env.ETH_CLIENT_WS}`);
        }
        catch (err) {
            logger_1.logger.error(`[WEBSOCKET] Cannot establish connection: ${process.env.ETH_CLIENT_WS}`);
        }
    }
    return ws_provider;
};
// Meant to be called everytime this commit-mgr service is restarted
exports.restartSubscriptions = () => __awaiter(void 0, void 0, void 0, function* () {
    const activeTrees = yield MerkleTree_1.merkleTrees.find({
        _id: { $regex: /_0$/ },
        active: true
    });
    const provider = exports.get_ws_provider();
    provider.on('block', (result) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug(`NEW BLOCK: %o`, result);
    }));
    // For all 'active' MerkleTrees, search through old logs for any 
    // newLeaf events we missed while service was offline. Then resubscribe
    // to the events.
    for (let i = 0; i < activeTrees.length; i++) {
        const contractAddress = activeTrees[i]._id.slice(0, -2);
        const fromBlock = activeTrees[i].latestLeaf ? activeTrees[i].latestLeaf.blockNumber : 0;
        yield exports.checkChainLogs(contractAddress, fromBlock);
        events_1.subscribeMerkleEvents(contractAddress);
    }
});
exports.checkChainLogs = (contractAddress, fromBlock) => __awaiter(void 0, void 0, void 0, function* () {
    // If fromBlock is provided, check next block so we don't add a leaf that was already captured
    const blockNum = fromBlock ? fromBlock + 1 : 0;
    logger_1.logger.info(`Checking chain logs for missed newLeaf events starting at block ${fromBlock} for contract: ${contractAddress}`);
    // besu has a bug where 'eth_getLogs' expects 'fromBlock' to be a string instead of integer
    let convertedBlockNum = blockNum;
    switch (process.env.ETH_CLIENT_TYPE) {
        case "besu":
            convertedBlockNum = `${blockNum}`;
            break;
        case "infura-gas":
            convertedBlockNum = "0x" + blockNum.toString(16);
            break;
        case "infura":
            convertedBlockNum = "0x" + blockNum.toString(16);
            break;
    }
    ;
    const params = {
        fromBlock: convertedBlockNum,
        toBlock: "latest",
        address: contractAddress,
        topics: [events_1.newLeafEvent]
    };
    const res = yield exports.jsonrpc('eth_getLogs', [params]);
    const logs = res.result;
    const contractInterface = new ethers_1.ethers.utils.Interface(shield_contract_1.shieldContract.abi);
    for (let i = 0; i < logs.length; i++) {
        const txLogs = contractInterface.parseLog(logs[i]);
        const leafIndex = txLogs.args[0].toNumber();
        const leafValue = txLogs.args[1];
        logger_1.logger.info(`Found previously missed leaf index ${leafIndex} of value ${leafValue}`);
        const leaf = {
            hash: leafValue,
            leafIndex: leafIndex,
            txHash: logs[i].transactionHash,
            blockNumber: logs[i].blockNumber
        };
        yield leaves_1.insertLeaf(contractAddress, leaf);
    }
});
exports.jsonrpc = (method, params, id) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.post(process.env.ETH_CLIENT_HTTP, {
        jsonrpc: "2.0",
        id: id || 1,
        method: method,
        params: params
    });
    return response.data;
});
//# sourceMappingURL=utils.js.map