//import * as dotenv from 'dotenv';
//dotenv.config();
import { readFileSync } from 'fs';
// Include envfile
import { parse, stringify } from 'envfile';

export default function commitMgrEnv() {

    const fileEnv = readFileSync('./.env', 'utf-8');
    //console.log("ENV ---- ", parse(fileEnv));

    const {
      NODE_ENV,
      LOG_LEVEL,
      SERVER_PORT,
      DATABASE_USER,
      DATABASE_PASSWORD,
      DATABASE_HOST,
      DATABASE_NAME,
      ETH_CLIENT_TYPE,
      INFURA_ID,
      ETH_CLIENT_WS,
      ETH_CLIENT_HTTP,
      CHAIN_ID,
      WALLET_PRIVATE_KEY,
      WALLET_PUBLIC_KEY
    } = parse(fileEnv);
  
    const regex = /['"]+/g;
    const updatedEnv = {
      NodeEnv: NODE_ENV.replace(regex, ''),
      LogLevel: LOG_LEVEL.replace(regex, ''),
      ServerPort: SERVER_PORT.replace(regex, ''),
      DatabaseUser: DATABASE_USER.replace(regex, ''),
      DatabaseName: DATABASE_NAME.replace(regex, ''),
      DatabasePassword: DATABASE_PASSWORD.replace(regex, ''),
      DatabaseHost: DATABASE_HOST.replace(regex, ''),
      EthClientType: ETH_CLIENT_TYPE.replace(regex, ''),
      InfuraId: INFURA_ID.replace(regex, ''),
      EthClientWs: ETH_CLIENT_WS.replace(regex, ''),
      EthClientHttp: ETH_CLIENT_HTTP.replace(regex, ''),
      ChainId: CHAIN_ID.replace(regex, ''),
      WalletPrivateKey: WALLET_PRIVATE_KEY.replace(regex, ''),
      WalletPublicKey: WALLET_PUBLIC_KEY.replace(regex, '')
    };
  
    console.log("updatedEnv---- ", updatedEnv);

    return updatedEnv;
}