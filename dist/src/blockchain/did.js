"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.didVerifyWellKnownDidConfiguration = exports.didGenerateDidConfiguration = exports.didIdentityManagerCreateIdentity = exports.execShellTest = void 0;
const shell = __importStar(require("shelljs"));
exports.execShellTest = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = shell.exec('git --version');
    // Run external tool synchronously
    if (result.code !== 0) {
        shell.echo('Error: Git commit failed');
        shell.exit(1);
    }
    return result;
});
exports.didIdentityManagerCreateIdentity = (domain) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield shell.cd('did').exec(`yarn daf execute -m identityManagerCreateIdentity -a '{"domain":"${domain}"}'`);
    // Run external tool synchronously
    if (result.code !== 0) {
        shell.echo('Error: DAF identityManagerCreateIdentity failed');
        //shell.exit(1);
        return 'Error: DAF identityManagerCreateIdentity failed';
    }
    shell.cd('..');
    return result.split('Result (Identity interface):')[1].split('Done')[0];
});
exports.didGenerateDidConfiguration = (did, domain) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield shell.cd('did').exec(`yarn daf execute -m generateDidConfiguration -a '{"dids":["${did}"],"domain":"${domain}"}'`);
    // Run external tool synchronously
    if (result.code !== 0) {
        shell.echo('Error: DAF generateDidConfiguration failed');
        //shell.exit(1);
        return 'Error: DAF generateDidConfiguration failed';
    }
    shell.cd('..');
    return result.split('):')[1].split('Done')[0];
    //return result;
});
exports.didVerifyWellKnownDidConfiguration = (domain) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield shell.cd('did').exec(`yarn daf execute -m verifyWellKnownDidConfiguration -a '{"domain":"${domain}"}'`);
    // Run external tool synchronously
    if (result.code !== 0) {
        shell.echo('Error: DAF verifyWellKnownDidConfiguration failed');
        //shell.exit(1);
        return 'Error: DAF verifyWellKnownDidConfiguration failed';
    }
    if (result.split('):')[1] === undefined) {
        shell.echo('Error: DAF verifyWellKnownDidConfiguration - Failed to download the .well-known DID');
        //shell.exit(1);
        return 'Error: DAF verifyWellKnownDidConfiguration - Failed to download the .well-known DID';
    }
    shell.cd('..');
    return result.split('):')[1].split('Done')[0];
    //return result;
});
//# sourceMappingURL=did.js.map