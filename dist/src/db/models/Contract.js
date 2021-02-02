"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contractBaseline = void 0;
const mongoose_1 = require("mongoose");
// This schema stores information relating to each node of the tree. Note that a leaf shares this same schema.
const contractSchema = new mongoose_1.Schema({
    name: String,
    network: String,
    blockNumber: Number,
    txHash: String,
    address: String,
    active: Boolean
});
// Automatically generate createdAt and updatedAt fields
contractSchema.set('timestamps', true);
exports.contractBaseline = mongoose_1.model('contract-baseline', contractSchema);
//# sourceMappingURL=Contract.js.map