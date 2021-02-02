"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reqErrorLogger = exports.reqLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const express_winston_1 = __importDefault(require("express-winston"));
const path_1 = __importDefault(require("path"));
const static_1 = require("./static");
const format_1 = require("./format");
const logsPath = path_1.default.join(static_1.rootPath, './logs');
// Logging level for environment level
// TODO: Adjust anyhow
const env = process.env.NODE_ENV || 'development';
const envLevel = env === 'production' ? 'info' : 'debug';
// Date for log filename
const getDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const utcTimestamp = () => {
    // 'YYYY-MM-DD HH:mm:ss',
    const epoch = new Date().getTime();
    const date = new Date(epoch);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hour = `${date.getUTCHours()}`.padStart(2, '0');
    const minute = `${date.getUTCMinutes()}`.padStart(2, '0');
    const second = `${date.getUTCSeconds()}`.padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};
// Transports
const transports = {
    defaultConsole: new winston_1.default.transports.Console({
        level: envLevel,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp({
            format: utcTimestamp
        }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.simple(), format_1.filterWithout('http'), format_1.defaultConsoleFormat),
    }),
    reqHttpConsole: new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.timestamp({
            format: utcTimestamp
        }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.simple(), format_1.reqHttpConsoleFormat),
    }),
    defaultFile: new winston_1.default.transports.File({
        filename: logsPath + `/${getDateString()}_debug.log`,
        level: envLevel,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp({
            format: utcTimestamp
        }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.simple(), format_1.filterWithout('http'), format_1.defaultFileFormat),
    }),
    reqHttpFile: new winston_1.default.transports.File({
        filename: logsPath + `/${getDateString()}_debug.log`,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp({
            format: utcTimestamp,
        }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.simple(), format_1.reqHttpFileFormat),
    }),
};
// Logger
exports.logger = winston_1.default.createLogger({
    transports: [
        transports.defaultConsole,
        transports.defaultFile,
    ],
    levels: static_1.levels,
    // Do not exit on handled exceptions
    exitOnError: false,
});
exports.reqLogger = (service) => express_winston_1.default.logger({
    transports: [
        transports.reqHttpConsole,
        transports.reqHttpFile
    ],
    meta: true,
    statusLevels: false,
    colorize: false,
    // Pass service string via msg
    msg: service,
    bodyWhitelist: ['method'],
});
exports.reqErrorLogger = (service) => express_winston_1.default.errorLogger({
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.File({ filename: logsPath + `/${getDateString()}_debug.log` }),
    ],
    format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.json()),
    // Pass service string via msg
    msg: service,
});
//# sourceMappingURL=index.js.map