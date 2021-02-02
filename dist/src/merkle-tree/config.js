"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const nodeHashLength = process.env.HASH_TYPE === 'mimc' ? 32 : 27;
const zeroHex = process.env.HASH_TYPE === 'mimc'
    ? '0x0000000000000000000000000000000000000000000000000000000000000000'
    : '0x000000000000000000000000000000000000000000000000000000';
const config = {
    // general:
    // ZERO: '0x0000000000000000000000000000000000000000000000000000000000000000', // 32-byte hex string representing zero, for hashing with '0' up the tree.
    ZERO: zeroHex,
    // Tree parameters. You also need to set these in the MerkleTree.sol contract.
    HASH_TYPE: process.env.HASH_TYPE,
    LEAF_HASHLENGTH: 32,
    NODE_HASHLENGTH: nodeHashLength,
    BUCKET_SIZE: 25000,
    ZOKRATES_PRIME: '21888242871839275222246405745257275088548364400416034343698204186575808495617',
    POLLING_FREQUENCY: 6000,
    FILTER_GENESIS_BLOCK_NUMBER: 0,
    tolerances: {
        LAG_BEHIND_CURRENT_BLOCK: 5,
    },
    UPDATE_FREQUENCY: 100,
    BULK_WRITE_BUFFER_SIZE: 1000,
};
exports.config = config;
//# sourceMappingURL=config.js.map