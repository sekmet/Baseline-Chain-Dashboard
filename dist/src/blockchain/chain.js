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
exports.runTests3 = exports.sendBaselineVerifyAndPush = exports.sendBaselineGetTracked = exports.sendBaselineTrack = exports.sendBaselineBalance = exports.sendFirstLeaf = exports.sendCommit = exports.deployContracts = exports.switchChain = exports.getBalance = exports.deposit = exports.waitRelayTx = exports.txManager = exports.wallet = exports.web3provider = void 0;
const ethers_1 = require("ethers");
const axios_1 = __importDefault(require("axios"));
const shelljs_1 = __importDefault(require("shelljs"));
const logger_1 = require("../logger");
const dotenv_1 = __importDefault(require("dotenv"));
const hash_1 = require("../merkle-tree/hash");
const Shield_json_1 = __importDefault(require("../../artifacts/Shield.json"));
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
exports.switchChain = (network) => __awaiter(void 0, void 0, void 0, function* () {
    const result = network === 'local' ? shelljs_1.default.exec('cp .env.localdev .env') : shelljs_1.default.exec('cp .env.network .env');
    // Run external tool synchronously
    if (result.code !== 0) {
        shelljs_1.default.echo('Error: Switch chain failed');
        shelljs_1.default.exit(1);
    }
    return result;
});
exports.deployContracts = (sender, verifierContractAddress, network, saveContract, saveCommiment) => __awaiter(void 0, void 0, void 0, function* () {
    let txHash;
    let shieldContractAddress;
    let treeHeight = 2;
    let contractInfo;
    if (verifierContractAddress === undefined) {
        const verifierAddress = yield axios_1.default.post('http://api.baseline.test/deploy-verifier-contract', {
            contractName: "Verifier.sol",
            deployedNetwork: network,
            sender: sender
        })
            .then((response) => {
            //access the resp here....
            logger_1.logger.debug(`Deploy: ${response.data}`);
            return response.data;
        })
            .then((txVerifierHash) => __awaiter(void 0, void 0, void 0, function* () {
            logger_1.logger.debug(`Tx Verifier Hash: ${txVerifierHash}`);
            return yield axios_1.default.post(process.env.ETH_CLIENT_HTTP, {
                jsonrpc: "2.0",
                method: "eth_getTransactionReceipt",
                params: [txVerifierHash],
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
                    txHash: txVerifierHash,
                    address: result.result.contractAddress,
                    active: true
                };
                saveContract(contractInfo);
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
        verifierContractAddress = verifierAddress;
    }
    //############### Deploy Shield.sol contract: eth_sendRawTransaction
    let nonce = yield exports.wallet.getTransactionCount();
    const abiCoder = new ethers_1.ethers.utils.AbiCoder();
    logger_1.logger.debug('Verifier Address: ', verifierContractAddress);
    // Encode the constructor parameters, then append to bytecode
    const encodedParams = abiCoder.encode(["address", "uint"], [verifierContractAddress, treeHeight]);
    const bytecodeWithParams = Shield_json_1.default.bytecode + encodedParams.slice(2).toString();
    const unsignedTx = {
        from: sender,
        data: bytecodeWithParams,
        nonce,
        gasLimit: 0
    };
    let gasEstimate = yield exports.wallet.estimateGas(unsignedTx);
    unsignedTx.gasLimit = Math.ceil(Number(gasEstimate) * 1.1);
    const tx = yield exports.wallet.sendTransaction(unsignedTx);
    yield tx.wait();
    txHash = tx.hash;
    //################## Retrieve Shield.sol tx receipt
    const txDetails = yield axios_1.default.post('http://api.baseline.test/jsonrpc', {
        jsonrpc: "2.0",
        method: "eth_getTransactionReceipt",
        params: [txHash],
        id: 1,
    })
        .then((response) => {
        //access the resp here....
        logger_1.logger.debug(`Shield Contract Address : ${response.data.result.contractAddress}`);
        shieldContractAddress = response.data.result.contractAddress;
        contractInfo = {
            name: 'Shield.sol',
            network: network,
            blockNumber: response.data.result.blockNumber,
            txHash: txHash,
            address: response.data.result.contractAddress,
            active: true
        };
        saveContract(contractInfo);
        return response.data.result;
    })
        .catch((error) => {
        logger_1.logger.error(error);
        return false;
    });
    //#################### Counterparty sends 1st leaf into untracked Shield contract
    nonce = yield exports.wallet.getTransactionCount();
    const proof = [5];
    const publicInputs = ["0xc2f480d4dda9f4522b9f6d590011636d904accfe59f12f9d66a0221c2558e3a2"]; // Sha256 hash of new commitment
    const newCommitment = "0xda9f452dccccccccccccccccccccccccccccccccccccccccccccccccccccc799";
    const shieldInterface = new ethers_1.ethers.utils.Interface(Shield_json_1.default.abi);
    const txData = shieldInterface.encodeFunctionData("verifyAndPush(uint256[],uint256[],bytes32)", [proof, publicInputs, newCommitment]);
    const unsignedLeafTx = {
        to: shieldContractAddress,
        from: sender,
        data: txData,
        nonce,
        gasLimit: 0
    };
    gasEstimate = yield exports.wallet.estimateGas(unsignedLeafTx);
    unsignedLeafTx.gasLimit = Math.ceil(Number(gasEstimate) * 1.1);
    const txLeaf = yield exports.wallet.sendTransaction(unsignedLeafTx);
    yield txLeaf.wait();
    const txReceipt = yield exports.web3provider.getTransactionReceipt(txLeaf.hash);
    if (network === 'local') {
        // Save commitment to db if network is local
        let newCommit = {
            commitHash: publicInputs[0],
            commitment: newCommitment,
            network: 'local' // always local network *TODO
        };
        yield saveCommiment(newCommit);
    }
    logger_1.logger.debug(`TX Receipt Contract Address: ${txReceipt.txHash}`);
    logger_1.logger.debug(`TX Receipt Status: ${txReceipt.status}`);
    //################## Baseline_track should initiate merkle tree in db
    const initiateMerkle = yield axios_1.default.post('http://api.baseline.test/jsonrpc', {
        jsonrpc: "2.0",
        method: "baseline_track",
        params: [shieldContractAddress],
        id: 1,
    })
        .then((response) => {
        //access the resp here....
        logger_1.logger.debug(`Baseline Track : ${response.data.result}`);
        return response.data.result;
    })
        .catch((error) => {
        logger_1.logger.error(error);
        return false;
    });
    logger_1.logger.debug(`Initiate Merkle Tree Status: ${initiateMerkle}`);
    //#################### Baseline_getCommit should detect 1st leaf already in tree
    const leafIndex = 0;
    const baselineGetCommit = yield axios_1.default.post('http://api.baseline.test/jsonrpc', {
        jsonrpc: "2.0",
        method: "baseline_getCommit",
        params: [shieldContractAddress, leafIndex],
        id: 1,
    })
        .then((response) => {
        //access the resp here....
        const merkleNode = response.data.result;
        let leafValue = merkleNode.hash;
        logger_1.logger.debug(`Baseline Leaf Value : ${leafValue}`);
        return response.data.result;
    })
        .catch((error) => {
        logger_1.logger.error(error);
        return false;
    });
    logger_1.logger.debug(`Baseline_getCommit should detect 1st leaf already in tree: ${baselineGetCommit.txHash}`);
    //###################### baseline_getRoot returns root hash
    const baselineGetRoot = yield axios_1.default.post('http://api.baseline.test/jsonrpc', {
        jsonrpc: "2.0",
        method: "baseline_getRoot",
        params: [shieldContractAddress],
        id: 1,
    })
        .then((response) => {
        //access the resp here....
        const rootHash = response.data.result;
        logger_1.logger.debug(`Baseline Root Hash : ${rootHash}`);
        return response.data.result;
    })
        .catch((error) => {
        logger_1.logger.error(error);
        return false;
    });
    //END run tests
    return true;
});
// Counterparty sends 1st leaf into untracked Shield contract
exports.sendCommit = (newCommitment, sender, shieldContractAddress, network, saveCommiment) => __awaiter(void 0, void 0, void 0, function* () {
    const proof = [5];
    //const publicInputs = ["0x9f72ea0cf49536e3c66c787f705186df9a4378083753ae9536d65b3ad7fcddc4"]; // Sha256 hash of new commitment
    //const newCommitment = "0x8222222222222222222222222222222222222222222222222222222222222222";
    //const newCommitment = "0x7465737400000000000000000000000000000000000000000000000000000000
    logger_1.logger.debug(`NETWORK >>> ${network}`);
    const newCommitHash = hash_1.concatenateThenHash([newCommitment]);
    const publicInputs = [`${newCommitHash}`]; // Sha256 hash of new commitment
    let buffer = Buffer.alloc(32);
    //buffer.fill('0', 0, 32);
    buffer.write(newCommitment, "utf-8");
    buffer.fill('0', buffer.length, 32);
    const bufferCommitmentHash = Buffer.from(buffer);
    logger_1.logger.debug(`newCommitmentHash: 0x${bufferCommitmentHash.toString('hex')}`);
    const newCommitmentHash = `0x${bufferCommitmentHash.toString('hex')}`;
    const sendCommitLeaf = yield axios_1.default.post('http://api.baseline.test/jsonrpc', {
        jsonrpc: "2.0",
        method: "baseline_verifyAndPush",
        params: [sender, shieldContractAddress, proof, publicInputs, newCommitmentHash],
        id: 1,
    })
        .then((response) => __awaiter(void 0, void 0, void 0, function* () {
        //access the resp here....
        const txHash = response.data.result.txHash;
        logger_1.logger.debug(`Baseline Send Commit TxHash : ${txHash}`);
        if (network === 'local') {
            // Save commitment to db if network is local
            let newCommit = {
                commitHash: publicInputs[0],
                commitment: newCommitmentHash,
                network: 'local' // always local network *TODO
            };
            yield saveCommiment(newCommit);
        }
        return response.data.result;
    }))
        .catch((error) => {
        logger_1.logger.error(error);
        return false;
    });
    //###################### baseline_getRoot returns root hash
    const baselineGetRoot = yield axios_1.default.post('http://api.baseline.test/jsonrpc', {
        jsonrpc: "2.0",
        method: "baseline_getRoot",
        params: [shieldContractAddress],
        id: 1,
    })
        .then((response) => {
        //access the resp here....
        const rootHash = response.data.result;
        logger_1.logger.debug(`Baseline Root Hash : ${rootHash}`);
        return response.data.result;
    })
        .catch((error) => {
        logger_1.logger.error(error);
        return false;
    });
    return sendCommitLeaf;
});
// Counterparty sends 1st leaf into untracked Shield contract
exports.sendFirstLeaf = (sender, shieldContractAddress, network) => __awaiter(void 0, void 0, void 0, function* () {
    let txReceipt;
    // const balance = await sendBaselineBalance(sender);
    const nonce = yield exports.wallet.getTransactionCount();
    const proof = [5];
    const publicInputs = ["0xc2f480d4dda9f4522b9f6d590011636d904accfe59f12f9d66a0221c2558e3a2"]; // Sha256 hash of new commitment
    const newCommitment = "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
    const shieldInterface = new ethers_1.ethers.utils.Interface(Shield_json_1.default.abi);
    const txData = shieldInterface.encodeFunctionData("verifyAndPush(uint256[],uint256[],bytes32)", [proof, publicInputs, newCommitment]);
    const unsignedTx = {
        to: shieldContractAddress,
        from: sender,
        data: txData,
        nonce,
        gasLimit: 0,
    };
    const gasEstimate = yield exports.wallet.estimateGas(unsignedTx);
    unsignedTx.gasLimit = Math.ceil(Number(gasEstimate) * 1.1);
    logger_1.logger.debug(`gasEstimate: ${gasEstimate}`);
    const tx = yield exports.wallet.sendTransaction(unsignedTx);
    yield tx.wait();
    txReceipt = yield exports.web3provider.getTransactionReceipt(tx.hash);
    return txReceipt;
});
//baseline_track should initiate merkle tree in db
exports.sendBaselineBalance = (senderAddress) => __awaiter(void 0, void 0, void 0, function* () {
    return yield axios_1.default.post('http://api.baseline.test/jsonrpc', {
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [
            senderAddress,
            "latest"
        ],
        id: 1,
    })
        .then((response) => {
        //access the resp here....
        logger_1.logger.debug(`Account Balance : ${response.data.result}`);
        return response.data.result;
    })
        .catch((error) => {
        logger_1.logger.error(error);
        return error;
    });
});
//baseline_track should initiate merkle tree in db
exports.sendBaselineTrack = (contractAddress, network) => __awaiter(void 0, void 0, void 0, function* () {
    return yield axios_1.default.post('http://api.baseline.test/jsonrpc', {
        jsonrpc: "2.0",
        method: "baseline_track",
        params: [contractAddress],
        id: 1,
    })
        .then((response) => {
        //access the resp here....
        logger_1.logger.debug(`Status baseline_track: ${response.data.result}`);
        return response.data.result;
    })
        .catch((error) => {
        logger_1.logger.error(error);
        return error;
    });
});
//baseline_getTracked should return deployed contract
exports.sendBaselineGetTracked = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield axios_1.default.post('http://api.baseline.test/jsonrpc', {
        jsonrpc: "2.0",
        method: "baseline_getTracked",
        params: [],
        id: 1,
    })
        .then((response) => {
        //access the resp here....
        logger_1.logger.debug(`Status baseline_getTracked: ${response.data.result}`);
        return response.data.result;
    })
        .catch((error) => {
        logger_1.logger.error(error);
        return error;
    });
});
//baseline_verifyAndPush creates 1st leaf
exports.sendBaselineVerifyAndPush = (sender, contractAddress, network) => __awaiter(void 0, void 0, void 0, function* () {
    //let txReceipt;
    const proof = [5];
    const publicInputs = ["0x02d449a31fbb267c8f352e9968a79e3e5fc95c1bbeaa502fd6454ebde5a4bedc"]; // Sha256 hash of new commitment
    const newCommitment = "0x1111111111111111111111111111111111111111111111111111111111111115";
    const res = yield axios_1.default.post("http://api.baseline.test/jsonrpc", {
        jsonrpc: "2.0",
        method: "baseline_verifyAndPush",
        params: [sender, contractAddress, proof, publicInputs, newCommitment],
        id: 1,
    })
        .then((response) => {
        //access the resp here....
        return response.data.result;
    })
        .catch((error) => {
        logger_1.logger.error(error);
        return false;
    });
    /*if (res) {
      const txHash = res;
      // ITX txs return relayHash, so need to be managed differently
      //if (txManager === 'infura-gas') {
      //  txReceipt = await waitRelayTx(txHash);
      //} else {
        txReceipt = await web3provider.waitForTransaction(txHash);
      //}
      logger.debug(`Status baseline_track: ${res} - ${txReceipt}`);
  
      return txReceipt;
    } else {
      logger.error(res);
      return false;
    }*/
    return res;
});
exports.runTests3 = (senderAddress, network, saveContract) => __awaiter(void 0, void 0, void 0, function* () {
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
            saveContract(contractInfo);
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
            contractInfo = {
                name: 'Shield.sol',
                network: network,
                blockNumber: result.result.blockNumber,
                txHash: txHash,
                address: result.result.contractAddress,
                active: true
            };
            saveContract(contractInfo);
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