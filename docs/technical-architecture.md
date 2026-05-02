# RegenX Technical Architecture

## 1. Overview

RegenX is a tokenised real-world asset infrastructure platform built on Stellar. The platform enables clean energy assets such as solar and battery storage projects to be structured into regulated investment vehicles and represented as Stellar-issued assets.

The platform is designed to connect off-chain legal ownership structures with on-chain settlement, ownership tracking, and auditability.

## 2. Core Architecture

RegenX uses a layered architecture:

1. User / Access Layer  
2. RegenX Application Layer  
3. Payment & Settlement Layer  
4. Stellar Blockchain / Wallet Layer  
5. Off-chain Legal & Operational Layer  
6. Clean Energy Asset Layer  

## 3. Stellar Asset Issuance Model

Each project or project series is represented as a Stellar-issued asset.

The architecture uses:

- Issuer Wallet: creates the Stellar asset for a specific project or series
- Distributor Wallet: receives and manages issued supply
- Investor Wallets: one custodial wallet per verified investor
- Trustlines: investor wallets establish trustlines before receiving project assets

This separates asset creation from distribution and supports controlled issuance, transfer, and ownership tracking.

## 4. Investor Wallet Model

Each investor is assigned a dedicated wallet controlled through RegenX’s backend custody model.

The investor wallet is used to:

- hold tokenised project ownership
- establish trustlines to project assets
- receive distributions
- maintain auditable transaction records

Self-custody may be supported later, but the current architecture prioritises custodial investor wallets to align with regulated investment structures.

## 5. AUDD Settlement Layer

RegenX plans to integrate AUDD as the primary stablecoin settlement rail for Australian dollar-denominated flows.

AUDD will support:

- investor subscriptions into projects
- capital calls
- milestone-based project funding
- revenue distributions back to investors

This allows the platform to use Stellar for fast, low-cost, auditable settlement while keeping the investment experience aligned with Australian dollar-denominated assets.

## 6. Transaction Flow

The current transaction architecture follows this process:

1. Verified investor selects an eligible project
2. Platform checks investor eligibility and wallet status
3. Platform checks or creates the required trustline
4. Backend builds an unsigned Stellar transaction XDR
5. Investor-side flow signs the XDR
6. Backend submits the signed transaction to Stellar
7. Transaction hash is stored in the RegenX backend
8. Ownership record is updated after confirmed settlement

This ensures on-chain activity and off-chain ownership records remain aligned.

## 7. Off-chain Legal Structure

RegenX is designed to operate through regulated investment structures such as SPVs and Managed Investment Scheme aligned structures.

The off-chain layer includes:

- project SPV or series structure
- trustee / custodian
- administrator
- investor registry
- compliance and contracts
- bank accounts and fiat rails

The Stellar asset represents the digital record of ownership or economic exposure, while the legal ownership and investor rights are governed by the relevant off-chain agreements.

## 8. Application Layer

The RegenX application layer includes:

- investor onboarding and verification
- project developer onboarding
- project approval workflows
- token issuance configuration
- investor allocation engine
- ownership dashboard
- reporting dashboard
- admin controls for project lifecycle management

## 9. Current Product Status

RegenX has implemented a working MVP on Stellar Testnet.

Implemented or in progress:

- project onboarding
- investor onboarding
- token issuance configuration
- Stellar transaction flow
- ownership records
- investor dashboard
- admin project approval flow
- custodial investor wallet model
- AUDD integration path

## 10. Mainnet Roadmap

The next phase is focused on moving from testnet MVP to mainnet readiness.

Key milestones:

1. Complete investor wallet provisioning and custody workflow
2. Finalise issuer and distributor wallet management
3. Complete AUDD subscription and distribution integration
4. Complete project issuance and investor allocation flow
5. Add transaction monitoring and reconciliation
6. Complete pilot project execution
7. Launch first mainnet asset issuance

## 11. Stellar Ecosystem Value

RegenX creates value for the Stellar ecosystem by bringing real-world infrastructure assets and Australian dollar settlement flows onto Stellar.

The platform is expected to generate:

- new Stellar asset issuance
- investor wallet creation
- trustline creation
- AUDD transaction volume
- recurring distribution transactions
- real-world asset lifecycle activity on Stellar

## 12. Summary

RegenX is not simply tokenising assets. It is building a regulated capital formation and settlement layer for real-world infrastructure assets on Stellar.

The platform combines off-chain legal structuring with on-chain issuance, wallet infrastructure, stablecoin settlement, and auditable ownership records.

## 13. Integration with Stellar Ecosystem Building Blocks

RegenX is designed to integrate with approved Stellar ecosystem building blocks to support wallet interaction, trustline management, and payment distribution flows.

### Stellar Wallets Kit

RegenX will integrate Stellar Wallets Kit to support wallet connection, authentication, and interaction with Stellar-compatible wallets.

This will support:

- investor wallet connection
- transaction signing flows
- trustline creation and management
- future support for multiple wallet providers

### Freighter Connect

RegenX will integrate Freighter Connect as an investor-facing wallet connection option for users who wish to interact with Stellar assets through a browser wallet.

Freighter Connect will support:

- investor wallet authentication
- trustline creation for project assets
- signing of Stellar transactions
- interaction with tokenised project assets

RegenX’s default near-term model remains custodial investor wallets, with one wallet provisioned per verified investor. Freighter Connect provides an additional wallet interaction pathway and supports future self-custody or hybrid custody options where appropriate.

### Stellar Disbursement Platform

RegenX will integrate Stellar Disbursement Platform (SDP) to support scalable investor payment and distribution workflows.

SDP will support:

- investor distributions
- recurring payment flows
- automated bulk disbursements
- reconciliation of payment activity

### Stablecoin Settlement Layer

RegenX is integrating AUDD as the primary Australian dollar stablecoin settlement asset for:

- investor subscriptions
- capital deployment
- revenue distributions

AUDD will be used alongside Stellar-based wallet and payment infrastructure to support real-world capital flows.

### Future Integrations

As the platform scales, RegenX may evaluate additional approved ecosystem building blocks for on/off-ramping, liquidity routing, and institutional wallet infrastructure.
