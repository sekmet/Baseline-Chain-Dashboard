"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEthClientInfo = exports.get_chain_id_info = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../logger");
dotenv_1.default.config();
let eth_client_ws;
let eth_client_http;
exports.get_chain_id_info = () => {
    /* # Chain ID */
    let result;
    let CHAIN_ID = 5;
    switch (process.env.CHAIN_ID) {
        /* # 1: Mainnet*/
        case 1:
            result = { ws_provider: "wss://mainnet.infura.io/ws/v3/", http_provider: "https://mainnet.infura.io/v3/" };
            break;
        /* # 3: Ropsten*/
        case 3:
            result = { ws_provider: "wss://ropsten.infura.io/ws/v3/", http_provider: "https://ropsten.infura.io/v3/" };
            break;
        /* # 4: Rinkeby*/
        case 4:
            result = { ws_provider: "wss://rinkeby.infura.io/ws/v3/", http_provider: "https://rinkeby.infura.io/v3/" };
            break;
        /* # 5: Goerli*/
        case 5:
            result = { ws_provider: "wss://goerli.infura.io/ws/v3/", http_provider: "https://goerli.infura.io/v3/" };
            break;
        /* # 42: Kovan*/
        case 42:
            result = { ws_provider: "wss://kovan.infura.io/ws/v3/", http_provider: "https://kovan.infura.io/v3/" };
            break;
        /* # 101010: Custom network (private ganache or besu network)*/
        case 101010:
            result = { ws_provider: "ws://localhost:", http_provider: "http://localhost:" };
            break;
    }
    return result;
};
exports.getEthClientInfo = () => {
    // get chain information to connect
    const chain_info = exports.get_chain_id_info();
    let result;
    /* # Ethereum client */
    switch (process.env.ETH_CLIENT_TYPE) {
        case "infura": {
            eth_client_ws = `${chain_info.ws_provider}${process.env.INFURA_ID}`;
            eth_client_http = `${chain_info.http_provider}${process.env.INFURA_ID}`;
            logger_1.logger.info("infura: Infura's traditional jsonrpc API");
            result = { ws_provider: eth_client_ws, http_provider: eth_client_http };
            break;
        }
        case "infura-gas": {
            eth_client_ws = `${chain_info.ws_provider}${process.env.INFURA_ID}`;
            eth_client_http = `${chain_info.http_provider}${process.env.INFURA_ID}`;
            logger_1.logger.info("infura: Infura's Managed Transaction (ITX) service");
            result = { ws_provider: eth_client_ws, http_provider: eth_client_http };
            break;
        }
        case "ganache": {
            eth_client_ws = `${chain_info.ws_provider}${8545}`;
            eth_client_http = `${chain_info.http_provider}${8545}`;
            logger_1.logger.info("ganache: local, private ganache network");
            result = { ws_provider: eth_client_ws, http_provider: eth_client_http };
            break;
        }
        case "besu": {
            eth_client_ws = `${chain_info.ws_provider}${8546}`;
            eth_client_http = `${chain_info.http_provider}${8545}`;
            logger_1.logger.info("besu: local, private besu network");
            result = { ws_provider: eth_client_ws, http_provider: eth_client_http };
            break;
        }
        default: {
            logger_1.logger.error(`Sorry, this client is not supported: ${expr}.`);
            break;
        }
    }
    return result;
};
//# sourceMappingURL=chain.js.map