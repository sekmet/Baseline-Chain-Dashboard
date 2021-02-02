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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTree = exports.getSiblingPathByLeafIndex = exports.getPathByLeafIndex = void 0;
const config_1 = require("./config");
const leaves_1 = require("./leaves");
const MerkleTree_1 = require("../db/models/MerkleTree");
const logger_1 = require("../logger");
const utils = __importStar(require("./utils"));
/**
 * Calculate the path (each parent up the tree) from a given leaf to the root.
 * @param {string} merkleId - a MerkleTree.sol contract address
 * @param {integer} leafIndex - the index of the leaf for which we are computing the path
 */
function getPathByLeafIndex(merkleId, leafIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info(`getPathByLeafIndex(${merkleId}, ${leafIndex})`);
        yield updateTree(merkleId);
        const merkleTree = yield MerkleTree_1.merkleTrees.findOne({ _id: `${merkleId}_0` });
        const treeHeight = merkleTree.treeHeight;
        // construct an array of indices to query from the db:
        const singleNodeIndex = utils.leafIndexToNodeIndex(treeHeight, leafIndex);
        const pathIndices = utils.getPathIndices(singleNodeIndex);
        let pathNodes = [];
        let prevBucket = 0;
        let merkleSegment = merkleTree;
        // Check whether some nodeIndices don't yet exist in the db. 
        // If they don't, we'll presume their values are zero, and add these to the 'nodes' before returning them.
        for (let count = 0; count < pathIndices.length; count++) {
            const nodeIndex = pathIndices[count];
            const bucketIndex = yield utils.calculateBucket(nodeIndex);
            // Fetch new bucket if calculated index differs from prevBucket
            if (bucketIndex !== prevBucket) {
                merkleSegment = yield MerkleTree_1.merkleTrees.findOne({ _id: `${merkleId}_${bucketIndex}` });
                prevBucket = bucketIndex;
            }
            const nodes = merkleSegment.nodes;
            const localIndex = nodeIndex % config_1.config.BUCKET_SIZE;
            let node = {
                nodeIndex,
                hash: config_1.config.ZERO
            };
            if (nodes[localIndex]) {
                node.hash = nodes[localIndex].hash;
            }
            // insert the node into the nodes array:
            pathNodes.push(node);
        }
        return pathNodes;
    });
}
exports.getPathByLeafIndex = getPathByLeafIndex;
/**
 * Calculate the siblingPath or 'witness path' for a given leaf.
 * @param {string} merkleId - a MerkleTree.sol contract address
 * @param {integer} leafIndex - the index of the leaf for which we are computing the siblingPath
 */
function getSiblingPathByLeafIndex(merkleId, leafIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info(`getSiblingPathByLeafIndex(${merkleId}, ${leafIndex})`);
        const merkleTree = yield MerkleTree_1.merkleTrees.findOne({ _id: `${merkleId}_0` });
        const treeHeight = merkleTree.treeHeight;
        // construct an array of indices to query from the db:
        const singleNodeIndex = utils.leafIndexToNodeIndex(treeHeight, leafIndex);
        const siblingPathIndices = utils.getSiblingPathIndices(singleNodeIndex);
        const siblingNodes = [];
        let prevBucket = 0;
        let merkleSegment = merkleTree;
        for (let count = 0; count < siblingPathIndices.length; count++) {
            const nodeIndex = siblingPathIndices[count];
            const bucketIndex = yield utils.calculateBucket(nodeIndex);
            // Fetch new bucket if calculated index differs from prevBucket
            if (bucketIndex !== prevBucket) {
                merkleSegment = yield MerkleTree_1.merkleTrees.findOne({ _id: `${merkleId}_${bucketIndex}` });
                prevBucket = bucketIndex;
            }
            const nodes = merkleSegment.nodes;
            const localIndex = nodeIndex % config_1.config.BUCKET_SIZE;
            let node = {
                nodeIndex,
                hash: config_1.config.ZERO
            };
            // Check whether some nodeIndices don't yet exist in the db. 
            // If they don't, we'll presume their values are zero, and add these to the 'nodes' before returning them.
            if (nodes[localIndex]) {
                node.hash = nodes[localIndex].hash;
            }
            // insert the node into the nodes array:
            siblingNodes.push(node);
        }
        return siblingNodes;
    });
}
exports.getSiblingPathByLeafIndex = getSiblingPathByLeafIndex;
/**
 * Updates the entire tree based on the latest-stored leaves.
 * @param {string} merkleId - a MerkleTree.sol contract address
 * @param {string} root - root hash of the merkle tree
 */
function updateTree(merkleId) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info(`Updating merkle tree: ${merkleId}`);
        const merkleTree_0 = yield MerkleTree_1.merkleTrees.findOne({ _id: `${merkleId}_0` });
        const { treeHeight, latestLeaf } = merkleTree_0;
        if (!latestLeaf.blockNumber) {
            logger_1.logger.info('There are no (reliable) leaves in the tree. Nothing to update.');
            return "0x0000000000000000000000000000000000000000000000000000000000000000";
        }
        // get the latest recalculation (to know how up-to-date the nodes of our tree actually are):
        let latestRecalculation = merkleTree_0.latestRecalculation || {};
        const latestRecalculationLeafIndex = (latestRecalculation.leafIndex === undefined) ? -1 : latestRecalculation.leafIndex;
        const fromLeafIndex = latestRecalculationLeafIndex + 1;
        const toLeafIndex = latestLeaf && latestLeaf.leafIndex ? latestLeaf.leafIndex : 0;
        logger_1.logger.debug(`latestRecalculationLeafIndex: ${latestRecalculationLeafIndex}`);
        logger_1.logger.debug(`toLeafIndex: ${toLeafIndex}`);
        // Check whether we're already up-to-date
        if (latestRecalculationLeafIndex < toLeafIndex) {
            // We're not up-to-date. Recalculate any nodes along the path from the new leaves to the root
            logger_1.logger.debug(`Updating the tree from leaf ${fromLeafIndex} to leaf ${toLeafIndex}`);
            const numberOfHashes = utils.getNumberOfHashes(toLeafIndex, fromLeafIndex, treeHeight);
            logger_1.logger.debug(`${numberOfHashes} hashes are required to update the tree...`);
            let { frontier } = latestRecalculation;
            frontier = frontier === undefined ? [] : frontier;
            const leaves = yield leaves_1.getLeavesByLeafIndexRange(merkleId, fromLeafIndex, toLeafIndex);
            const leafValues = leaves.map(leaf => leaf.hash);
            logger_1.logger.debug(`found leaves: %o`, leaves);
            logger_1.logger.debug(`leafValues: %o`, leafValues);
            logger_1.logger.debug(`current leaf count: ${fromLeafIndex}`);
            const root = yield utils.updateNodes(merkleId, frontier, leafValues, fromLeafIndex);
            return root;
        }
        logger_1.logger.info(`The tree is already up to date. Root is ${latestRecalculation.root}`);
        return latestRecalculation.root;
    });
}
exports.updateTree = updateTree;
//# sourceMappingURL=index.js.map