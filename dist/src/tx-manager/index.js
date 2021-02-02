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
Object.defineProperty(exports, "__esModule", { value: true });
exports.txManagerServiceFactory = void 0;
const infura_gas_1 = require("./infura-gas");
const eth_client_1 = require("./eth-client");
function txManagerServiceFactory(provider, config) {
    return __awaiter(this, void 0, void 0, function* () {
        let service;
        switch (provider) {
            case "infura-gas":
                service = new infura_gas_1.InfuraGas(config);
                break;
            case "infura":
                service = new eth_client_1.EthClient(config);
                break;
            case "besu":
                service = new eth_client_1.EthClient(config);
                break;
            case "ganache":
                service = new eth_client_1.EthClient(config);
                break;
            default:
                throw new Error('TxManager provider not found.');
        }
        return service;
    });
}
exports.txManagerServiceFactory = txManagerServiceFactory;
//# sourceMappingURL=index.js.map