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
exports.getLeavesByLeafIndexRange = exports.getLeafByLeafIndex = exports.insertLeaf = void 0;
const logger_1 = require("../logger");
const MerkleTree_1 = require("../db/models/MerkleTree");
const utils_1 = require("./utils");
/**
 * Insert a new leaf into the merkle tree
 * @param {string} contractAddress - address of merkle-tree contract
 * @param {object} leaf
 */
function insertLeaf(contractAddress, leaf) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info(`Inserting new leaf for merkle id ${contractAddress}: %o`, leaf);
        // Find tree height
        const merkleTree_0 = yield MerkleTree_1.merkleTrees.findOne({ _id: `${contractAddress}_0` });
        const treeHeight = merkleTree_0.treeHeight;
        // Calculate bucket for leaf location
        const nodeIndex = utils_1.leafIndexToNodeIndex(treeHeight, leaf.leafIndex);
        const bucketIndex = yield utils_1.calculateBucket(nodeIndex);
        logger_1.logger.debug(`Calculated bucket index: ${bucketIndex}`);
        const merkleSegment = yield MerkleTree_1.merkleTrees.findOne({ _id: `${contractAddress}_${bucketIndex}` });
        const nodes = merkleSegment.nodes;
        nodes[nodeIndex] = leaf;
        const latestLeaf = {
            blockNumber: leaf.blockNumber,
            leafIndex: leaf.leafIndex
        };
        yield MerkleTree_1.merkleTrees.updateOne({ _id: `${contractAddress}_${bucketIndex}` }, { nodes });
        const updatedTree = yield MerkleTree_1.merkleTrees.updateOne({ _id: `${contractAddress}_0` }, { latestLeaf });
        return updatedTree;
    });
}
exports.insertLeaf = insertLeaf;
/**
 * Get a single leaf by its leafIndex
 * @param {number} leafIndex
 * @returns {object} the leaf object
 */
function getLeafByLeafIndex(contractAddress, leafIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info(`Get leaf index ${leafIndex} for merkle id ${contractAddress}`);
        // Find tree height
        const merkleTree_0 = yield MerkleTree_1.merkleTrees.findOne({ _id: `${contractAddress}_0` });
        const treeHeight = merkleTree_0.treeHeight;
        // Calculate bucket for leaf location
        const nodeIndex = utils_1.leafIndexToNodeIndex(treeHeight, leafIndex);
        const bucketIndex = yield utils_1.calculateBucket(nodeIndex);
        const merkleSegment = yield MerkleTree_1.merkleTrees.findOne({ _id: `${contractAddress}_${bucketIndex}` });
        const result = merkleSegment.nodes.filter(node => {
            return node && node.leafIndex === leafIndex;
        });
        if (result[0])
            return result[0];
        return {};
    });
}
exports.getLeafByLeafIndex = getLeafByLeafIndex;
/**
 * Get all leaves within a range determined by their leafIndices
 * @param {string} contractAddress - address of merkle-tree contract
 * @param {number} minIndex
 * @param {number} maxIndex
 * @returns {array} an array of leaf objects
 */
function getLeavesByLeafIndexRange(contractAddress, minIndex, maxIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info(`Getting leaves for merkle id ${contractAddress} in index range: ${minIndex} - ${maxIndex}`);
        // Find tree height
        const merkle_0 = yield MerkleTree_1.merkleTrees.findOne({ _id: `${contractAddress}_0` });
        const treeHeight = merkle_0.treeHeight;
        let leaves = [];
        for (let leafIndex = minIndex; leafIndex <= maxIndex; leafIndex++) {
            // Calculate bucket for leaf location
            const nodeIndex = utils_1.leafIndexToNodeIndex(treeHeight, leafIndex);
            const bucketIndex = yield utils_1.calculateBucket(nodeIndex);
            const merkleSegment = yield MerkleTree_1.merkleTrees.findOne({ _id: `${contractAddress}_${bucketIndex}` });
            const result = merkleSegment.nodes.filter(node => {
                return node && (node.leafIndex >= leafIndex) && (node.leafIndex <= maxIndex);
            });
            leaves = leaves.concat(result);
            const incr = result.length ? result.length - 1 : 0;
            leafIndex += incr;
        }
        return leaves;
    });
}
exports.getLeavesByLeafIndexRange = getLeavesByLeafIndexRange;
//# sourceMappingURL=leaves.js.map