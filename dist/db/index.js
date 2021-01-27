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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbClose = exports.dbConnect = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../logger");
const config = {
    mongo: {
        debug: 'true',
        bufferMaxEntries: 8,
        firstConnectRetryDelaySecs: 5,
    },
    mongoose: {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: false,
        useCreateIndex: true,
        poolSize: 5,
        socketTimeoutMS: 0,
        keepAlive: true,
    }
};
const { firstConnectRetryDelaySecs } = config.mongo;
// Setup DB
const conn = mongoose_1.default.connection;
let mongoUrl;
// Registering db connection event listeners
conn.once('open', () => {
    logger_1.logger.info('Successfully connected to mongo db.');
    // When successfully connected
    conn.on('connected', () => {
        logger_1.logger.debug(`Mongoose default connection open ${mongoUrl}.`);
    });
    // If the connection throws an error
    conn.on('error', (err) => {
        logger_1.logger.error('Db connection error: %o', err);
    });
    // When the connection is disconnected
    conn.on('disconnected', () => {
        logger_1.logger.info('Mongoose default connection disconnected.');
    });
    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', () => {
        conn.close(() => {
            logger_1.logger.debug('Mongoose default connection disconnected through app termination.');
            process.exit(0);
        });
    });
});
function simpleSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function dbConnect(url) {
    return __awaiter(this, void 0, void 0, function* () {
        mongoUrl = url;
        if (config.mongo.debug === true) {
            mongoose_1.default.set('debug', function (collection, method, query, doc, options) {
                logger_1.logger.debug(`Mongoose ${method} on ${collection} with query:\n%o`, query, {
                    doc,
                    options
                });
            });
        }
        let connected = false;
        while (!connected) {
            try {
                // eslint-disable-next-line no-await-in-loop
                yield mongoose_1.default.connect(mongoUrl, config.mongoose);
                connected = true;
            }
            catch (err) {
                logger_1.logger.error('\n%o', err);
                logger_1.logger.info(`Retrying mongodb connection in ${firstConnectRetryDelaySecs}s.`);
            }
            // eslint-disable-next-line no-await-in-loop
            yield simpleSleep(firstConnectRetryDelaySecs * 1000);
        }
    });
}
exports.dbConnect = dbConnect;
function dbClose() {
    logger_1.logger.info('Closing db connection.');
    conn.close();
}
exports.dbClose = dbClose;
//# sourceMappingURL=index.js.map