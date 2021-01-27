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
exports.rpcServer = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const jayson_1 = __importDefault(require("jayson"));
const url_1 = __importDefault(require("url"));
const promiseJayson = __importStar(require("jayson/promise"));
const blockchain_1 = require("./blockchain");
const MerkleTree_1 = require("./db/models/MerkleTree");
const logger_1 = require("./logger");
const merkle_tree_1 = require("./merkle-tree");
const leaves_js_1 = require("./merkle-tree/leaves.js");
const hash_js_1 = require("./merkle-tree/hash.js");
const tx_manager_1 = require("./tx-manager");
// configs loaded
dotenv_1.default.config();
// Forward these requests to the web3 provider service
// NOTE: although `url.parse` is deprecated `new URL('<url-here>')` does not provide
// the required `path` attribute on the resulting object, only `pathname` which is
// not currently compatible with the `jayson` library
const relayRequest = (methodName) => {
    return new jayson_1.default.Method((args, context, done) => __awaiter(void 0, void 0, void 0, function* () {
        const rpcUrl = url_1.default.parse(process.env.ETH_CLIENT_HTTP);
        let client;
        const ethClientHttp = process.env.ETH_CLIENT_HTTP.split(":");
        if (ethClientHttp[0] === "https") {
            client = promiseJayson.Client.https(rpcUrl);
        }
        else {
            client = promiseJayson.Client.http(rpcUrl);
        }
        const { result, error } = yield client.request(methodName, args);
        done(error, result);
    }), {
        useContext: true,
    });
};
const baseline_getCommit = new jayson_1.default.Method((args, context, done) => __awaiter(void 0, void 0, void 0, function* () {
    const error = validateParams(args, 2);
    if (error) {
        done(error, null);
        return;
    }
    ;
    const contractAddress = args[0];
    const leafIndex = args[1];
    const result = yield leaves_js_1.getLeafByLeafIndex(contractAddress, leafIndex);
    done(null, result);
}), {
    useContext: true,
});
const baseline_getCommits = new jayson_1.default.Method((args, context, done) => __awaiter(void 0, void 0, void 0, function* () {
    let error = validateParams(args, 3);
    if (error) {
        done(error, null);
        return;
    }
    ;
    const contractAddress = args[0];
    const startLeafIndex = args[1];
    const count = args[2];
    if (count < 1) {
        error = {
            code: -32602,
            message: `Invalid params`,
            data: `Param "count" must be greater than 0`
        };
        done(error, null);
        return;
    }
    ;
    const endLeafIndex = startLeafIndex + count - 1;
    const result = yield leaves_js_1.getLeavesByLeafIndexRange(contractAddress, startLeafIndex, endLeafIndex);
    done(null, result);
}), {
    useContext: true,
});
// Retrieve root from db and on-chain. Verify they are equal
const baseline_getRoot = new jayson_1.default.Method((args, context, done) => __awaiter(void 0, void 0, void 0, function* () {
    let error = validateParams(args, 1);
    if (error) {
        done(error, null);
        return;
    }
    ;
    const contractAddress = args[0];
    let root;
    try {
        root = yield merkle_tree_1.updateTree(contractAddress);
    }
    catch (err) {
        logger_1.logger.error(`[baseline_getRoot] ${err}`);
        error = {
            code: -32603,
            message: `Internal server error`
        };
        done(error, null);
        return;
    }
    done(null, root);
}), {
    useContext: true,
});
const baseline_getProof = new jayson_1.default.Method((args, context, done) => __awaiter(void 0, void 0, void 0, function* () {
    let error = validateParams(args, 2);
    if (error) {
        done(error, null);
        return;
    }
    ;
    const contractAddress = args[0];
    const leafIndex = args[1];
    let pathNodes;
    try {
        pathNodes = yield merkle_tree_1.getSiblingPathByLeafIndex(contractAddress, leafIndex);
    }
    catch (err) {
        logger_1.logger.error(`[baseline_getProof] ${err}`);
        error = {
            code: -32603,
            message: `Internal server error`
        };
        done(error, null);
        return;
    }
    done(null, pathNodes);
}), {
    useContext: true,
});
// Returns array containing addresses of all 'active' Shield contracts
const baseline_getTracked = new jayson_1.default.Method((args, context, done) => __awaiter(void 0, void 0, void 0, function* () {
    const error = validateParams(args, 0);
    if (error) {
        done(error, null);
        return;
    }
    ;
    // Use regex so that we don't count same address multiple times if it spans more than one doc/bucket
    const trackedContracts = yield MerkleTree_1.merkleTrees.find({
        _id: { $regex: /_0$/ },
        active: true
    }).select('_id').lean();
    const contractAddresses = [];
    for (const contract of trackedContracts) {
        const address = contract._id.slice(0, -2); // Cut off trailing "_0"
        contractAddresses.push(address);
    }
    logger_1.logger.info(`Found ${contractAddresses.length} tracked contracts`);
    done(null, contractAddresses);
}), {
    useContext: true,
});
const baseline_verifyAndPush = new jayson_1.default.Method((args, context, done) => __awaiter(void 0, void 0, void 0, function* () {
    let error = validateParams(args, 5);
    if (error) {
        done(error, null);
        return;
    }
    ;
    const senderAddress = args[0];
    const contractAddress = args[1];
    const proof = args[2];
    const publicInputs = args[3];
    const newCommitment = args[4];
    const record = yield MerkleTree_1.merkleTrees.findOne({ _id: `${contractAddress}_0` }).select('shieldContract').lean();
    if (!record) {
        logger_1.logger.error(`[baseline_verifyAndPush] Merkle Tree not found in db: ${contractAddress}`);
        error = {
            code: -32603,
            message: `Internal server error`,
            data: `Merkle Tree not found in db: ${contractAddress}`,
        };
        done(error, null);
        return;
    }
    logger_1.logger.info(`[baseline_verifyAndPush] Found Shield/MerkleTree for contract address: ${contractAddress}`);
    const txManager = yield tx_manager_1.txManagerServiceFactory(process.env.ETH_CLIENT_TYPE);
    let result;
    try {
        result = yield txManager.insertLeaf(contractAddress, senderAddress, proof, publicInputs, newCommitment);
    }
    catch (err) {
        logger_1.logger.error(`[baseline_verifyAndPush] ${err}`);
        error = {
            code: -32603,
            message: `Internal server error`
        };
        done(error, null);
        return;
    }
    logger_1.logger.info(`[baseline_verifyAndPush] txHash: ${result.txHash}`);
    done(result.error, { txHash: result.txHash });
}), {
    useContext: true,
});
const baseline_track = new jayson_1.default.Method((args, context, done) => __awaiter(void 0, void 0, void 0, function* () {
    let error = validateParams(args, 1);
    if (error) {
        done(error, null);
        return;
    }
    ;
    const contractAddress = args[0];
    const merkleTree = yield MerkleTree_1.merkleTrees.findOne({ _id: `${contractAddress}_0` });
    if (merkleTree && merkleTree.active === true) {
        error = {
            code: -32603,
            message: `Internal server error`,
            data: `Already tracking MerkleTree at address ${contractAddress}`
        };
        done(error, null);
        return;
    }
    const methodSignature = "0x01e3e915"; // function selector for "treeHeight()"
    const res = yield blockchain_1.jsonrpc("eth_call", [
        {
            "to": contractAddress,
            "data": methodSignature
        },
        "latest"
    ]);
    if (res.error) {
        done(res.error, res.result);
        return;
    }
    const treeHeight = Number(res.result);
    if (!treeHeight) {
        error = {
            code: -32603,
            message: `Internal server error`,
            data: `Could not retreive treeHeight from blockchain`
        };
        done(error, null);
        return;
    }
    logger_1.logger.info(`[baseline_track] found treeHeight of ${treeHeight} for contract ${contractAddress}`);
    yield MerkleTree_1.merkleTrees.findOneAndUpdate({ _id: `${contractAddress}_0` }, {
        _id: `${contractAddress}_0`,
        treeHeight,
        active: true
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    yield blockchain_1.checkChainLogs(contractAddress, 0);
    error = blockchain_1.subscribeMerkleEvents(contractAddress);
    done(error, true);
}), {
    useContext: true,
});
const baseline_untrack = new jayson_1.default.Method((args, context, done) => __awaiter(void 0, void 0, void 0, function* () {
    args[1] = args[1] || false;
    let error = validateParams(args, 2);
    if (error) {
        done(error, null);
        return;
    }
    ;
    const contractAddress = args[0];
    const prune = args[1];
    const foundTree = yield MerkleTree_1.merkleTrees.find({
        _id: { $regex: new RegExp(contractAddress) }
    }).select('_id').lean();
    if (foundTree.length === 0) {
        logger_1.logger.error(`[baseline_untrack] Merkle Tree not found in db: ${contractAddress}`);
        error = {
            code: -32603,
            message: `Internal server error`,
            data: `Merkle Tree not found in db: ${contractAddress}`,
        };
        done(error, null);
        return;
    }
    ;
    blockchain_1.unsubscribeMerkleEvents(contractAddress);
    // If prune === true, wipe tree from storage
    if (prune === true) {
        yield MerkleTree_1.merkleTrees.deleteMany({ _id: { $regex: new RegExp(contractAddress) } });
    }
    else {
        yield MerkleTree_1.merkleTrees.updateOne({ _id: `${contractAddress}_0` }, { active: false }, { upsert: true, new: true });
    }
    ;
    done(null, true);
}), {
    useContext: true,
});
// Verify a given leaf is part of the merkle tree by using the sibling path
const baseline_verify = new jayson_1.default.Method((args, context, done) => __awaiter(void 0, void 0, void 0, function* () {
    const error = validateParams(args, 3);
    if (error) {
        done(error, null);
        return;
    }
    ;
    const contractAddress = args[0];
    const leafValue = args[1];
    const siblingNodes = args[2];
    const root = siblingNodes[siblingNodes.length - 1].hash;
    const updatedRoot = yield merkle_tree_1.updateTree(contractAddress);
    let currentHash = leafValue;
    for (let index = 0; index < siblingNodes.length - 1; index++) {
        if (siblingNodes[index].nodeIndex % 2 === 0) {
            // even nodeIndex
            currentHash = hash_js_1.concatenateThenHash(currentHash, siblingNodes[index].hash);
        }
        else {
            // odd nodeIndex
            currentHash = hash_js_1.concatenateThenHash(siblingNodes[index].hash, currentHash);
        }
    }
    const result = (root === currentHash) && (root === updatedRoot);
    done(null, result);
}), {
    useContext: true,
});
function validateParams(inputs, numInputs) {
    let error;
    if (inputs.length !== numInputs) {
        error = {
            code: -32602,
            message: `Invalid params`,
            data: `Expected number of inputs to be ${numInputs} but received ${inputs.length}`
        };
        return error;
    }
    for (let index = 0; index < numInputs; index++) {
        if (inputs[index] === undefined || inputs[index] === null) {
            error = {
                code: -32602,
                message: `Invalid params`,
                data: `Param index ${index} not defined`
            };
        }
    }
    return error;
}
// Defines valid JSON-RPC methods in this format: <method_name>: <method_action>
const methods = {
    baseline_getCommit,
    baseline_getCommits,
    baseline_getRoot,
    baseline_getProof,
    baseline_getTracked,
    baseline_verifyAndPush,
    baseline_track,
    baseline_untrack,
    baseline_verify
};
// Requests to methods not defined here will produce a response with error code -32601 "Method not found"
exports.rpcServer = new jayson_1.default.Server(methods, {
    useContext: true,
    router(method, params) {
        // regular by-name routing first
        if (this._methods[method])
            return this._methods[method];
        // Blindly relay all methods not defined by this server
        else
            return relayRequest(method);
    },
});
//# sourceMappingURL=rpc-server.js.map