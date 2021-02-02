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
exports.deployContracts = exports.getBalance = exports.deposit = exports.waitRelayTx = exports.txManager = exports.wallet = exports.web3provider = void 0;
const ethers_1 = require("ethers");
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../logger");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const commitMgrEndpoint = "http://api.baseline.test/jsonrpc";
exports.web3provider = new ethers_1.ethers.providers.JsonRpcProvider(commitMgrEndpoint);
exports.wallet = new ethers_1.Wallet(process.env.WALLET_PRIVATE_KEY, exports.web3provider);
exports.txManager = process.env.ETH_CLIENT_TYPE;
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.waitRelayTx = function (relayTxHash) {
    return __awaiter(this, void 0, void 0, function* () {
        let mined = false;
        while (!mined) {
            const statusResponse = yield exports.web3provider.send('relay_getTransactionStatus', [
                relayTxHash
            ]);
            for (let i = 0; i < statusResponse.length; i++) {
                const hashes = statusResponse[i];
                const receipt = yield exports.web3provider.getTransactionReceipt(hashes.ethTxHash);
                if (receipt && receipt.confirmations && receipt.confirmations > 1) {
                    mined = true;
                    return receipt;
                }
            }
            yield sleep(1000);
        }
    });
};
exports.deposit = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = yield exports.wallet.sendTransaction({
            // This is the ITX PaymentDeposit contract address for Rinkeby
            //to: '0x015C7C7A7D65bbdb117C573007219107BD7486f9',
            // This is the ITX PaymentDeposit contract address for Goerli
            to: '0xE25118a1d97423c5a5454c43C5013dd169de2518',
            // Choose how much ether you want to deposit in the ITX gas tank
            value: ethers_1.ethers.utils.parseUnits('1.0', 'ether')
        });
        // Waiting for the transaction to be mined
        yield tx.wait();
    });
};
exports.getBalance = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const balance = yield exports.web3provider.send('relay_getBalance', [exports.wallet.address]);
        return balance;
    });
};
exports.deployContracts = (senderAddress, network) => __awaiter(void 0, void 0, void 0, function* () {
    //################ Deploy Verifier Contract
    let contractInfo;
    const verifierAddress = yield axios_1.default.post('http://api.baseline.test/deploy-verifier-contract', {
        contractName: "Verifier.sol",
        deployedNetwork: network,
        sender: senderAddress
    })
        .then((response) => {
        //access the resp here....
        logger_1.logger.debug(`Deploy: ${response.data}`);
        return response.data;
    })
        .then((txHash) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug(`Tx Hash: ${txHash}`);
        return yield axios_1.default.post(process.env.ETH_CLIENT_HTTP, {
            jsonrpc: "2.0",
            method: "eth_getTransactionReceipt",
            params: [txHash],
            id: 1
        })
            .then((eth_response) => {
            //access the resp here....
            const result = eth_response.data;
            //Alert('success', 'Settings saved...', 'Settings saved with success into .env file..');
            logger_1.logger.info(`Verifier Contract Address: ${result.result.contractAddress}`);
            contractInfo = {
                name: 'Verifier.sol',
                network: network,
                blockNumber: result.result.blockNumber,
                txHash: txHash,
                address: result.result.contractAddress,
                active: true
            };
            return result.result.contractAddress;
        })
            .catch((error) => {
            logger_1.logger.error(error);
            //Alert('error', 'ERROR...', "OOPS that didn't work :(");
        });
    }))
        .catch((error) => {
        logger_1.logger.error(error);
        //Alert('error', 'ERROR...', "OOPS that didn't work :(");
    });
    //############# Deploy Shield Contract
    yield axios_1.default.post('http://api.baseline.test/deploy-shield-contract', {
        contractName: "Shield.sol",
        deployedNetwork: network,
        verifierAddress: verifierAddress,
        sender: senderAddress
    })
        .then((response) => {
        //access the resp here....
        logger_1.logger.debug(`Deploy: ${response.data}`);
        return response.data;
    })
        .then((txHash) => __awaiter(void 0, void 0, void 0, function* () {
        logger_1.logger.debug(`Tx Hash: ${txHash}`);
        return yield axios_1.default.post(process.env.ETH_CLIENT_HTTP, {
            jsonrpc: "2.0",
            method: "eth_getTransactionReceipt",
            params: [txHash],
            id: 1
        })
            .then((eth_response) => {
            //access the resp here....
            const result = eth_response.data;
            //Alert('success', 'Settings saved...', 'Settings saved with success into .env file..');
            logger_1.logger.info(`Shield Contract Address: ${result.result.contractAddress}`);
            return result.result;
        })
            .catch((error) => {
            logger_1.logger.error(error);
            //Alert('error', 'ERROR...', "OOPS that didn't work :(");
        });
    }))
        .catch((error) => {
        logger_1.logger.error(error);
        //Alert('error', 'ERROR...', "OOPS that didn't work :(");
    });
    return true;
});
//# sourceMappingURL=chain.js.map