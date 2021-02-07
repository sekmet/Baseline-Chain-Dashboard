# Baseline Chain Dashboard(bri-2)

![Baseline Logo](./assets/img/baselineHorizontal-Logo-Full-Color.svg)


# Requirements
- docker and docker-compose
- node / npm
- yarn
- [metamask wallet](https://metamask.io/download.html)
- ether account with some funds - [get Goerli faucets here](https://faucet.goerli.mudit.blog/)
- [a infura account id](https://infura.io/)

# Usage and installation

### Clone Repo

1. git clone https://github.com/sekmet/Baseline-Chain-Dashboard.git

### Install packages and dependencies

2. cd Baseline-Chain-Dashboard
3. npm install

![Install packages and dependencies](./docs/install.gif)

### Build

![Build](./docs/build.gif)

4. npm run build:all

### Run development enviroment

5. npm run up:besu
6. npm run dev

![Run development enviroment](./docs/run-dev.gif)

### Or production enviroment

- npm install -g pm2
- npm run prod

# Setup and Settings

- Open [http://localhost:3000](http://localhost:3000) in your browser
- Login using your metamask wallet account
- Go Settings -> fill "infura id" and wallet private key fields -> Save

>*Switch network feature only fully works under production enviroment*


# Video Demo

[![Baseline Dashboard Demo](https://img.youtube.com/vi/Nm9v373pL0s/maxresdefault.jpg)](https://youtu.be/Nm9v373pL0s)

# Screenshots

![Login Page](./docs/baseline_dashboard_login.png)

![Dashboard](./docs/baseline_dashboard_1.png)

![Dashboard](./docs/baseline_dashboard_2.png)

![Dashboard](./docs/baseline_dashboard_3.png)

![Switch Network](./docs/baseline_dashboard_switch_network.png)

![Baseline DID Generator](./docs/baseline_didgenerator.png)

![Baseline Basic Phonebook](./docs/baseline_phonebook.png)

![Commit-mgr Settings](./docs/baseline_dashboard_settings.png)


# Contracts [GOERLI TEST NET]

[Shield.sol - 0x63758bc241d4cd924ebfbed273a2f6a1179f8f86](https://goerli.etherscan.io/address/0x63758bc241d4cd924ebfbed273a2f6a1179f8f86)

[VerifierNoop.sol - 0x76f272ba2b1c3887f117dfeeb600e53b50a2207b](https://goerli.etherscan.io/address/0x76f272ba2b1c3887f117dfeeb600e53b50a2207b)


# Changelog

## Alpha Release [0.1.0] 2021-01-28
> [X] started project Baseline Chain Switcher Demo and Components

> [X] added UI Dashboard

## [0.1.1] 2021-01-29
> [X] added commit-mgr service tests report to dashboard

> [X] commit-mgr should be configurable via env vars such that it can use Infura as its web3 provider

> [ ] a repeatable test suite should be written to ensure baseline transactions can be submitted through Infura

> [X] Shield.sol and Verifier.sol contracts should be deployed on a public testnet/mainnet (verifiable via etherscan or similar)

> [X] root/leaves of on-chain merkle-tree in Shield contract should match root/leaves of off-chain tree stored in mongo

> [ ] commitments made in private Besu network should be replicated on public testnet/mainnet

### Bonus features:
> [X] add Well-Known DID configuration generator

> [X] add simple Baseline Phonebook UI

> [ ] use a faucet account or another way to fund public testnet/mainnet transactions so that judges can easily run test suite.

> [ ] find a way to securely+efficiently move what has already gone to the private Besu chain instance and move that to the public ethereum mainnet before commencing with new transactions.

> [ ] the verification circuit enforces some business logic (instead of using a no-op circuit)

> [X] add a UI that allows the user to configure the commit-mgr service