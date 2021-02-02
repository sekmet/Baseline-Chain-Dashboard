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
exports.unsubscribeMerkleEvents = exports.subscribeMerkleEvents = exports.newLeafEvent = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const ethers_1 = require("ethers");
const logger_1 = require("../logger");
const leaves_1 = require("../merkle-tree/leaves");
const utils_1 = require("./utils");
const shield_contract_1 = require("./shield-contract");
dotenv_1.default.config();
exports.newLeafEvent = ethers_1.ethers.utils.id("NewLeaf(uint256,bytes32,bytes32)");
exports.subscribeMerkleEvents = (contractAddress) => {
    logger_1.logger.info(`Creating event listeners for contract: ${contractAddress}`);
    const singleLeafFilter = {
        address: contractAddress,
        topics: [exports.newLeafEvent]
    };
    const contractInterface = new ethers_1.ethers.utils.Interface(shield_contract_1.shieldContract.abi);
    const provider = utils_1.get_ws_provider();
    if (!provider) {
        error = {
            code: -32603,
            message: `WEBSOCKET: could not establish connection`,
            data: `Attempted endpoint: ${process.env.ETH_CLIENT_WS}`
        };
        return error;
    }
    provider.on(singleLeafFilter, (result) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.info(`NewLeaf event emitted for contract: ${contractAddress}`);
        const txLogs = contractInterface.parseLog(result);
        const leafIndex = txLogs.args[0].toNumber();
        const leafValue = txLogs.args[1];
        const onchainRoot = txLogs.args[2];
        logger_1.logger.info(`New on-chain root: ${onchainRoot}`);
        const leaf = {
            hash: leafValue,
            leafIndex: leafIndex,
            txHash: result.transactionHash,
            blockNumber: result.blockNumber
        };
        yield leaves_1.insertLeaf(contractAddress, leaf);
    }));
};
exports.unsubscribeMerkleEvents = (contractAddress) => {
    logger_1.logger.info(`Removing event listeners for contract: ${contractAddress}`);
    const singleLeafFilter = {
        address: contractAddress,
        topics: [exports.newLeafEvent]
    };
    const provider = utils_1.get_ws_provider();
    provider.off(singleLeafFilter);
};
//# sourceMappingURL=events.js.map