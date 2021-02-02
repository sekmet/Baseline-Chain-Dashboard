"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootPath = exports.server = exports.client = exports.redirection = exports.success = exports.information = exports.debug = exports.verbose = exports.info = exports.http = exports.deprecated = exports.warning = exports.error = exports.levels = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
// Logging levels
exports.levels = {
    error: 0,
    warning: 1,
    deprecated: 2,
    http: 3,
    info: 4,
    verbose: 5,
    debug: 6,
};
// Colors for logging levels
exports.error = chalk_1.default.bold.red;
exports.warning = chalk_1.default.bold.blackBright;
exports.deprecated = chalk_1.default.bold.keyword('orange');
exports.http = chalk_1.default.bold.blue;
exports.info = chalk_1.default.bold.whiteBright;
exports.verbose = chalk_1.default.bold.yellow;
exports.debug = chalk_1.default.bold.green;
// Colors for http status
exports.information = chalk_1.default.whiteBright;
exports.success = chalk_1.default.green;
exports.redirection = chalk_1.default.cyan;
exports.client = chalk_1.default.yellow;
exports.server = chalk_1.default.red;
// Root path
exports.rootPath = path_1.default.join(__dirname, '../../');
//# sourceMappingURL=static.js.map