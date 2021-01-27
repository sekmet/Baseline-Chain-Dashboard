"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterWithout = exports.filterOnly = exports.reqHttpFileFormat = exports.defaultFileFormat = exports.reqHttpConsoleFormat = exports.defaultConsoleFormat = void 0;
const winston_1 = __importDefault(require("winston"));
const os_1 = __importDefault(require("os"));
const static_1 = require("./static");
const levelFormat = (level) => {
    switch (level) {
        case 'error':
            return static_1.error(level.toUpperCase());
        case 'warning':
            return static_1.warning(level.toUpperCase());
        case 'deprecated':
            return static_1.deprecated(level.toUpperCase());
        case 'http':
            return static_1.http(level.toUpperCase());
        case 'info':
            return static_1.info(level.toUpperCase());
        case 'verbose':
            return static_1.verbose(level.toUpperCase());
        case 'debug':
            return static_1.debug(level.toUpperCase());
        default:
            return level;
    }
};
const statusFormat = (status) => {
    if (100 <= status && status <= 199) {
        return static_1.information(status.toString());
    }
    else if (200 <= status && status <= 299) {
        return static_1.success(status.toString());
    }
    else if (300 <= status && status <= 399) {
        return static_1.redirection(status.toString());
    }
    else if (400 <= status && status <= 499) {
        return static_1.client(status.toString());
    }
    else if (500 <= status && status <= 599) {
        return static_1.server(status.toString());
    }
    else {
        return status.toString();
    }
};
// Formats
exports.defaultConsoleFormat = winston_1.default.format.printf((_a) => {
    var { timestamp, level, service, message } = _a, args = __rest(_a, ["timestamp", "level", "service", "message"]);
    const timestampFormated = timestamp.slice(0, 19).replace('T', ' ');
    return `[${timestampFormated}] [${levelFormat(level)}]: ` +
        `${message} ${Object.keys(args).length ? JSON.stringify(args) : ''}`;
});
// TODO: handle batched requests
exports.reqHttpConsoleFormat = winston_1.default.format.printf(({ timestamp, level, message, meta }) => {
    const timestampFormated = timestamp.slice(0, 19).replace('T', ' ');
    level = 'http';
    const rpcMethod = meta.req.body ? meta.req.body.method : '';
    return `[${timestampFormated}] [${levelFormat(level)}]: ${meta.req.method} ` +
        `${meta.req.originalUrl} ${statusFormat(meta.res.statusCode)} ${meta.responseTime}ms ` +
        `[${rpcMethod}]`;
});
exports.defaultFileFormat = winston_1.default.format.printf((_a) => {
    var { timestamp, level, message } = _a, args = __rest(_a, ["timestamp", "level", "message"]);
    const timestampFormated = timestamp.slice(0, 19).replace('T', ' ');
    return `[${timestampFormated}] [${level.toUpperCase()}] [COMMIT-MGR] [${os_1.default.hostname()}]: ${message} ${Object.keys(args).length ? JSON.stringify(args) : ''}`;
});
// TODO: handle batched requests
exports.reqHttpFileFormat = winston_1.default.format.printf(({ timestamp, level, message, meta }) => {
    const timestampFormated = timestamp.slice(0, 19).replace('T', ' ');
    level = 'http';
    const rpcMethod = meta.req.body ? meta.req.body.method : '';
    const service = message;
    return `[${timestampFormated}] [${level.toUpperCase()}] [${service}] [${os_1.default.hostname()}]: ${meta.req.method} ` +
        `${meta.req.originalUrl} ${meta.res.statusCode} ${meta.responseTime}ms ` +
        `[${rpcMethod}] ${JSON.stringify(meta)}`;
});
// Filter
exports.filterOnly = (level) => {
    return winston_1.default.format((config) => {
        if (config.level === level) {
            return config;
        }
    })();
};
exports.filterWithout = (level) => {
    return winston_1.default.format((config) => {
        if (config.level !== level) {
            return config;
        }
    })();
};
//# sourceMappingURL=format.js.map