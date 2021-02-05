"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitmentBaseline = void 0;
const mongoose_1 = require("mongoose");
// This schema stores information relating to each node of the tree. Note that a leaf shares this same schema.
const commitmentSchema = new mongoose_1.Schema({
    commitHash: String,
    commitment: String,
    network: String // always local network *TODO
});
// Automatically generate createdAt and updatedAt fields
commitmentSchema.set('timestamps', true);
exports.commitmentBaseline = mongoose_1.model('commitment-baseline', commitmentSchema);
//# sourceMappingURL=Commitment.js.map