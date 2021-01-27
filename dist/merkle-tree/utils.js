"use strict";
// Set of utilities for merkle-tree calculations
// bit operations are essential for merkle-tree computations.
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
exports.getNumberOfHashes = exports.updateNodes = exports.getSiblingPathIndices = exports.getPathIndices = exports.calculateBucket = exports.leafIndexToNodeIndex = void 0;
/* tslint:disable no-bitwise */
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = require("./config");
const logger_1 = require("../logger");
const hash_1 = require("./hash");
const MerkleTree_1 = require("../db/models/MerkleTree");
dotenv_1.default.config();
function rightShift(integer, shift) {
    return Math.floor(integer / Math.pow(2, shift));
}
// INDEX CONVERSIONS
function calculateBucket(nodeIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        const bucketIndex = Math.floor(nodeIndex / config_1.config.BUCKET_SIZE);
        return bucketIndex;
    });
}
exports.calculateBucket = calculateBucket;
function leafIndexToNodeIndex(treeHeight, leaf_index) {
    const treeWidth = Math.pow(2, treeHeight);
    const leafIndex = Number(leaf_index);
    const nodeIndex = leafIndex + treeWidth - 1;
    logger_1.logger.debug(`leafIndex ${leafIndex} converted to nodeIndex ${nodeIndex}`);
    return nodeIndex;
}
exports.leafIndexToNodeIndex = leafIndexToNodeIndex;
// 'DECIMAL' NODE INDICES
function siblingNodeIndex(node_index) {
    const nodeIndex = Number(node_index);
    // odd? then the node is a left-node, so sibling is to the right.
    // even? then the node is a right-node, so sibling is to the left.
    const siblingIndex = nodeIndex % 2 === 1 ? nodeIndex + 1 : nodeIndex - 1;
    // If siblingIndex is negative, just return 0
    return siblingIndex < 0 ? 0 : siblingIndex;
}
function parentNodeIndex(node_index) {
    const nodeIndex = Number(node_index);
    return nodeIndex % 2 === 1 ? rightShift(nodeIndex, 1) : rightShift(nodeIndex - 1, 1);
}
// COMPLEX TREE FUNCTIONS
// Calculate the indices of the path from a particular leaf up to the root.
// @param {integer} nodeIndex - the nodeIndex of the leaf for which we wish to calculate the PathIndices. Not to be confused with leafIndex.
function getPathIndices(node_index) {
    let nodeIndex = Number(node_index);
    let indices = [];
    while (nodeIndex > 0) {
        const parentIndex = parentNodeIndex(nodeIndex);
        indices.push(parentIndex);
        nodeIndex = parentIndex;
    }
    return indices;
}
exports.getPathIndices = getPathIndices;
// Calculate the indices of the sibling path of a particular leaf up to the root.
// @param {integer} nodeIndex - the nodeIndex of the leaf for which we wish to calculate the siblingPathIndices. Not to be confused with leafIndex.
function getSiblingPathIndices(node_index) {
    const nodeIndex = Number(node_index);
    const indices = getPathIndices(nodeIndex);
    const firstSibling = siblingNodeIndex(nodeIndex);
    let siblingIndices = [firstSibling];
    for (let index = 0; index < indices.length; index++) {
        const siblingIndex = siblingNodeIndex(indices[index]);
        siblingIndices.push(siblingIndex);
    }
    logger_1.logger.info(`Found sibling indices: %o`, siblingIndices);
    return siblingIndices;
}
exports.getSiblingPathIndices = getSiblingPathIndices;
// Javascript implementation of the corresponding Solidity function in MerkleTree.sol
function getFrontierSlot(leafIndex) {
    let slot = 0;
    if (leafIndex % 2 === 1) {
        let exp1 = 1;
        let pow1 = 2;
        let pow2 = pow1 << 1;
        while (slot === 0) {
            if ((leafIndex + 1 - pow1) % pow2 === 0) {
                slot = exp1;
            }
            else {
                pow1 = pow2;
                pow2 <<= 1;
                exp1 += 1;
            }
        }
    }
    return slot;
}
// Javascript implementation of the corresponding Solidity function in MerkleTree.sol
function updateNodes(merkleId, frontier, leafValues, currentLeafCount) {
    return __awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info(`Updating nodes`);
        const merkleTree_0 = yield MerkleTree_1.merkleTrees.findOne({ _id: `${merkleId}_0` });
        const latestLeaf = merkleTree_0.latestLeaf;
        const treeHeight = merkleTree_0.treeHeight;
        const newFrontier = frontier;
        if (frontier.length !== treeHeight + 1 && treeHeight !== 32) {
            newFrontier.length = treeHeight + 1;
        }
        // check that space exists in the tree:
        const treeWidth = Math.pow(2, treeHeight);
        const numberOfLeavesAvailable = treeWidth - currentLeafCount;
        const numberOfLeaves = Math.min(leafValues.length, numberOfLeavesAvailable);
        let slot;
        // the node value before truncation (truncation is sometimes done so that the nodeValue (when concatenated with another)
        // fits into a single hashing round in the next hashing iteration up the tree).
        let nodeValueFull;
        // the truncated nodeValue
        let nodeValue;
        let nodeIndex;
        // consider each new leaf in turn, from left to right:
        for (let leafIndex = currentLeafCount; leafIndex < currentLeafCount + numberOfLeaves; leafIndex++) {
            nodeValueFull = leafValues[leafIndex - currentLeafCount];
            nodeValue = `0x${nodeValueFull.slice(-config_1.config.NODE_HASHLENGTH * 2)}`; // truncate hashed value, so it 'fits' into the next hash.
            nodeIndex = leafIndexToNodeIndex(treeHeight, leafIndex);
            slot = getFrontierSlot(leafIndex); // determine at which level we will next need to store a nodeValue
            if (slot === 0) {
                newFrontier[slot] = nodeValue; // store in frontier
                continue; // eslint-disable-line no-continue
            }
            // hash up to the level whose nodeValue we'll store in the frontier slot:
            for (let level = 1; level <= slot; level++) {
                if (nodeIndex % 2 === 0) {
                    // even nodeIndex
                    nodeValueFull = hash_1.concatenateThenHash(frontier[level - 1], nodeValue); // the parentValue, but will become the nodeValue of the next level
                    nodeValue = `0x${nodeValueFull.slice(-config_1.config.NODE_HASHLENGTH * 2)}`; // truncate hashed value, so it 'fits' into the next hash.
                }
                else {
                    // odd nodeIndex
                    nodeValueFull = hash_1.concatenateThenHash(nodeValue, config_1.config.ZERO); // the parentValue, but will become the nodeValue of the next level
                    nodeValue = `0x${nodeValueFull.slice(-config_1.config.NODE_HASHLENGTH * 2)}`; // truncate hashed value, so it 'fits' into the next hash.
                }
                nodeIndex = parentNodeIndex(nodeIndex); // move one row up the tree
                // Calculate bucket for leaf location
                const bucketIndex = yield calculateBucket(nodeIndex);
                const merkleSegment = yield MerkleTree_1.merkleTrees.findOne({ _id: `${merkleId}_${bucketIndex}` });
                const newNodes = merkleSegment.nodes;
                // update the newNodes array
                const node = {
                    hash: nodeValue,
                    nodeIndex,
                };
                logger_1.logger.debug(`Updated node: %o`, node);
                newNodes[nodeIndex % config_1.config.BUCKET_SIZE] = node;
                yield MerkleTree_1.merkleTrees.updateOne({ _id: `${merkleId}_${bucketIndex}` }, { nodes: newNodes });
            }
            newFrontier[slot] = nodeValue; // store in frontier
        }
        // So far we've added all leaves, and hashed up to a particular level of the tree. We now need to continue hashing from that level until the root:
        for (let level = slot + 1; level <= treeHeight; level++) {
            if (nodeIndex % 2 === 0) {
                // even nodeIndex
                nodeValueFull = hash_1.concatenateThenHash(frontier[level - 1], nodeValue); // the parentValue, but will become the nodeValue of the next level
                nodeValue = `0x${nodeValueFull.slice(-config_1.config.NODE_HASHLENGTH * 2)}`; // truncate hashed value, so it 'fits' into the next hash.
            }
            else {
                // odd nodeIndex
                nodeValueFull = hash_1.concatenateThenHash(nodeValue, config_1.config.ZERO); // the parentValue, but will become the nodeValue of the next level
                nodeValue = `0x${nodeValueFull.slice(-config_1.config.NODE_HASHLENGTH * 2)}`; // truncate hashed value, so it 'fits' into the next hash.
            }
            nodeIndex = parentNodeIndex(nodeIndex); // move one row up the tree
            // Calculate bucket for leaf location
            const bucketIndex = yield calculateBucket(nodeIndex);
            const merkleSegment = yield MerkleTree_1.merkleTrees.findOne({ _id: `${merkleId}_${bucketIndex}` });
            const newNodes = merkleSegment.nodes;
            // update the newNodes array
            const node = {
                hash: nodeIndex === 0 ? nodeValueFull : nodeValue,
                nodeIndex,
            };
            logger_1.logger.debug(`Updated node: %o`, node);
            newNodes[nodeIndex % config_1.config.BUCKET_SIZE] = node;
            yield MerkleTree_1.merkleTrees.updateOne({ _id: `${merkleId}_${bucketIndex}` }, { nodes: newNodes });
        }
        const root = nodeValueFull;
        const latestRecalculation = {
            blockNumber: latestLeaf.blockNumber,
            leafIndex: latestLeaf.leafIndex,
            root,
            frontier: newFrontier,
        };
        yield MerkleTree_1.merkleTrees.updateOne({ _id: `${merkleId}_0` }, { latestRecalculation });
        logger_1.logger.info(`Off-chain tree updated with new root: ${root}`);
        return root;
    });
}
exports.updateNodes = updateNodes;
;
/**
 * Calculates the exact number of hashes required to add a consecutive batch of leaves to a tree
 * @param {integer} maxLeafIndex - the highest leafIndex of the batch
 * @param {integer} minLeafIndex - the lowest leafIndex of the batch
 * @param {integer} height - the height of the merkle tree
 */
function getNumberOfHashes(maxLeafIndex, minLeafIndex, height) {
    let hashCount = 0;
    let increment;
    let hi = Number(maxLeafIndex);
    let lo = Number(minLeafIndex);
    const batchSize = hi - lo + 1;
    const binHi = hi.toString(2); // converts to binary
    const bitLength = binHi.length;
    for (let level = 0; level < bitLength; level += 1) {
        increment = hi - lo;
        hashCount += increment;
        hi = rightShift(hi, 1);
        lo = rightShift(lo, 1);
    }
    return hashCount + height - (batchSize - 1);
}
exports.getNumberOfHashes = getNumberOfHashes;
//# sourceMappingURL=utils.js.map