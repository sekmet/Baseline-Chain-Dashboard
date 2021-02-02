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
exports.InfuraGas = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const ethers_1 = require("ethers");
const logger_1 = require("../logger");
const blockchain_1 = require("../blockchain");
dotenv_1.default.config();
class InfuraGas {
    constructor(config) {
        this.config = config;
        this.config = config;
    }
    signTx(toAddress, fromAddress, txData) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = new ethers_1.Wallet(process.env.WALLET_PRIVATE_KEY, blockchain_1.http_provider);
            const nonce = yield wallet.getTransactionCount();
            logger_1.logger.debug(`nonce: ${nonce}`);
            const unsignedTx = {
                to: toAddress,
                from: fromAddress,
                data: txData,
                chainId: parseInt(process.env.CHAIN_ID, 10),
                gasLimit: 0,
                nonce
            };
            const gasEstimate = yield wallet.estimateGas(unsignedTx);
            logger_1.logger.debug(`gasEstimate: ${gasEstimate}`);
            const gasLimit = Math.ceil(Number(gasEstimate) * 1.1);
            logger_1.logger.debug(`gasLimit set: ${gasLimit}`);
            const relayTransactionHash = ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.defaultAbiCoder.encode(['address', 'bytes', 'uint', 'uint'], [toAddress, txData, gasLimit, process.env.CHAIN_ID] // Rinkeby chainId is 4
            ));
            const signature = yield wallet.signMessage(ethers_1.ethers.utils.arrayify(relayTransactionHash));
            return { signature, gasLimit };
        });
    }
    insertLeaf(toAddress, fromAddress, proof, publicInputs, newCommitment) {
        return __awaiter(this, void 0, void 0, function* () {
            let error = null;
            let txHash;
            try {
                const shieldInterface = new ethers_1.ethers.utils.Interface(blockchain_1.shieldContract.abi);
                const txData = shieldInterface.encodeFunctionData("verifyAndPush(uint256[],uint256[],bytes32)", [proof, publicInputs, newCommitment]);
                const { signature, gasLimit } = yield this.signTx(toAddress, fromAddress, txData);
                logger_1.logger.debug(`Signature for relay: ${signature}`);
                logger_1.logger.debug(`txData: ${txData}`);
                const transaction = {
                    to: toAddress,
                    data: txData,
                    gas: `${gasLimit}`
                };
                const res = yield blockchain_1.jsonrpc('relay_sendTransaction', [transaction, signature]);
                logger_1.logger.debug(`relay_sendTransaction response: %o`, res);
                txHash = res.result;
            }
            catch (err) {
                logger_1.logger.error('[baseline_verifyAndPush]:', err);
                if (err.error) {
                    error = { data: err.error.message };
                }
                else {
                    error = { data: err };
                }
            }
            return { error, txHash };
        });
    }
}
exports.InfuraGas = InfuraGas;
//# sourceMappingURL=infura-gas.js.map