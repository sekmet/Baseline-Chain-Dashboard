"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phonebookBaseline = void 0;
const mongoose_1 = require("mongoose");
// This schema stores information relating to each node of the tree. Note that a leaf shares this same schema.
const phonebookSchema = new mongoose_1.Schema({
    name: String,
    network: String,
    domain: String,
    dididentity: String,
    status: String,
    active: Boolean
});
// Automatically generate createdAt and updatedAt fields
phonebookSchema.set('timestamps', true);
exports.phonebookBaseline = mongoose_1.model('phonebook-baseline', phonebookSchema);
//# sourceMappingURL=Phonebook.js.map