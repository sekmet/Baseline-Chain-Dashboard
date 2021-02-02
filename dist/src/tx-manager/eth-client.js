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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthClient = void 0;
const ethers_1 = require("ethers");
const logger_1 = require("../logger");
const blockchain_1 = require("../blockchain");
class EthClient {
    constructor(config) {
        this.config = config;
        this.config = config;
    }
    signTx(toAddress, fromAddress, txData) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = new ethers_1.Wallet(process.env.WALLET_PRIVATE_KEY, blockchain_1.http_provider);
            const nonce = yield wallet.getTransactionCount();
            logger_1.logger.debug(`nonce: ${nonce}`);
            const gasPrice = yield wallet.getGasPrice();
            logger_1.logger.debug(`gasPrice found: ${gasPrice}`);
            const gasPriceSet = Math.ceil(Number(gasPrice) * 1.2);
            logger_1.logger.debug(`gasPrice set: ${gasPriceSet}`);
            const unsignedTx = {
                to: toAddress,
                from: fromAddress,
                data: txData,
                nonce,
                chainId: parseInt(process.env.CHAIN_ID, 10),
                gasLimit: 0,
                gasPrice: gasPriceSet
            };
            const gasEstimate = yield wallet.estimateGas(unsignedTx);
            logger_1.logger.debug(`gasEstimate: ${gasEstimate}`);
            unsignedTx.gasLimit = Math.ceil(Number(gasEstimate) * 1.1);
            logger_1.logger.debug(`gasLimit set: ${unsignedTx.gasLimit}`);
            const signedTx = wallet.signTransaction(unsignedTx);
            return signedTx;
        });
    }
    insertLeaf(toAddress, fromAddress, proof, publicInputs, newCommitment) {
        return __awaiter(this, void 0, void 0, function* () {
            let error = null;
            let txHash;
            try {
                const shieldInterface = new ethers_1.ethers.utils.Interface(blockchain_1.shieldContract.abi);
                const txData = shieldInterface.encodeFunctionData("verifyAndPush(uint256[],uint256[],bytes32)", [proof, publicInputs, newCommitment]);
                const signedTx = yield this.signTx(toAddress, fromAddress, txData);
                logger_1.logger.debug(`signedTx: ${signedTx}`);
                const res = yield blockchain_1.jsonrpc("eth_sendRawTransaction", [signedTx]);
                logger_1.logger.debug('eth_sendRawTransaction result:', res);
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
exports.EthClient = EthClient;
//# sourceMappingURL=eth-client.js.map