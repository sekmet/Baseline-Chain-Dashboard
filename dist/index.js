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
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const rpc_server_1 = require("./rpc-server");
const logger_1 = require("./logger");
const db_1 = require("./db");
const blockchain_1 = require("./blockchain");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    dotenv_1.default.config();
    const port = process.env.SERVER_PORT;
    logger_1.logger.info("Starting commmitment manager server...");
    const dbUrl = 'mongodb://' +
        `${process.env.DATABASE_USER}` + ':' +
        `${process.env.DATABASE_PASSWORD}` + '@' +
        `${process.env.DATABASE_HOST}` + '/' +
        `${process.env.DATABASE_NAME}`;
    logger_1.logger.debug(`Attempting to connect to db: ${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`);
    yield db_1.dbConnect(dbUrl);
    yield blockchain_1.get_ws_provider(); // Establish websocket connection
    yield blockchain_1.restartSubscriptions(); // Enable event listeners for active MerkleTrees
    const app = express_1.default();
    app.use(logger_1.reqLogger('COMMIT-MGR')); // Log requests
    app.use(logger_1.reqErrorLogger('COMMIT-MGR')); // Log errors
    app.use(body_parser_1.default.json({ limit: "2mb" })); // Pre-parse body content
    app.use(cors_1.default());
    app.get('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        res.sendStatus(200);
    }));
    // Single endpoint to handle all JSON-RPC requests
    app.post("/jsonrpc", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const context = {
            headers: req.headers,
            params: req.params,
            body: req.body,
            ipAddress: req.headers["x-forwarded-for"] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress,
        };
        yield rpc_server_1.rpcServer.call(req.body, context, (err, result) => {
            if (err) {
                const errorMessage = err.error.data ? `${err.error.message}: ${err.error.data}` : `${err.error.message}`;
                logger_1.logger.error(`Response error: ${errorMessage}`);
                res.send(err);
                return;
            }
            res.send(result || {});
        });
    }));
    app.listen(port, () => {
        logger_1.logger.info(`REST server listening on port ${port}.`);
    });
});
main();
//# sourceMappingURL=index.js.map