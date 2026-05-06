# RegenX Platform

RegenX is a tokenised infrastructure platform designed to enable institutional and wholesale investors to access clean energy assets through structured, on-chain investment products. It bridges real-world infrastructure with modern capital markets by combining regulated investment structures with blockchain-based ownership and settlement.

---

## The Problem

Mid-scale renewable energy projects such as solar and battery storage face a structural funding gap that slows deployment and limits investor access.

Key constraints include:
- Projects are too small or complex for traditional project finance
- Capital raising is fragmented and inefficient
- Limited liquidity reduces investor participation

At the same time, investors face:
- High minimum investment thresholds → limited accessibility  
- Long lock-up periods → reduced flexibility  
- Poor access to deal flow → missed opportunities  

👉 Result: Capital supply and project demand are misaligned.

---

## The Solution

RegenX structures clean energy projects into regulated investment vehicles and represents ownership as tokenised assets on Stellar.

This enables:
- Fractional ownership → broader investor access  
- Transparent ownership tracking → improved trust  
- Programmable settlement → efficient execution  
- Future liquidity pathways → secondary market potential  

👉 RegenX acts as a **capital formation layer**, aligning:
Developers → Structured Assets → Investors

---

## How It Works

The platform transforms a clean energy project into an investable product through a structured workflow.

Step-by-step flow:

Developer → Submits Project  
→ RegenX → Reviews & Structures Opportunity  
→ Stellar → Tokenised Asset Issuance  
→ Investor → Accesses & Commits Capital  
→ Transaction → Built (XDR) → Signed → Submitted  
→ Ownership → Recorded On-Chain + Off-Chain  
→ Ongoing → Reporting & Distributions  

👉 Each step is controlled, auditable, and scalable.

---

## Platform Architecture

RegenX is built as a layered system separating user experience, business logic, and blockchain execution.

Architecture flow:

Investors / Developers / Admin  
        ↓  
Frontend (core-ui)  
- dashboards  
- onboarding flows  
- investment interface  

        ↓  
Backend API (core-api)  
- project lifecycle management  
- investor verification  
- transaction orchestration  
- ownership tracking  

        ↓  
PostgreSQL Database  
- structured records  
- compliance data  
- reporting layer  

        ↓  
Stellar Network  
- asset issuance  
- transaction settlement  
- ownership representation  

        ↓  
AUDD (planned)  
- subscriptions  
- settlement  
- distributions  

👉 This separation enables scalability and institutional-grade control.

---

## Key Capabilities

RegenX supports full investment lifecycle infrastructure:

- Project onboarding → developer submissions + structuring  
- Investor verification → eligibility + compliance workflows  
- Token issuance → issuer + distributor wallet model  
- Ownership model → trustline-based asset holding  
- Transaction flow → unsigned XDR → client signing → submission  
- Data layer → off-chain ownership + reporting  
- Admin control → approvals, monitoring, lifecycle management  

👉 Designed for **institutional-grade capital flows**, not retail speculation.

---

## Repository Structure

The repository reflects the platform architecture:

regenx-platform/  
  core-api/    → backend services and logic  
  core-ui/     → frontend application  
  docs/        → architecture and workflow documentation  

👉 Clear separation of concerns = maintainability + scalability.

---

## Current Status

RegenX has developed a working MVP on Stellar Testnet with core functionality implemented.

Current progress:
- End-to-end flow → project → issuance → investment → ownership  
- Live onboarding → battery and solar pilot projects  
- Functional backend + frontend integration  
- Active development toward mainnet  

Next steps:
- Mainnet deployment  
- AUDD integration → real capital flows  
- Pilot transaction execution  

👉 Transitioning from prototype → live capital infrastructure.

---

## Why RegenX Wins

RegenX is not a marketplace.

It is **infrastructure for capital formation in clean energy**.

Key advantages:
- Aligns with institutional investment structures  
- Reduces friction in capital deployment  
- Enables fractional infrastructure ownership  
- Introduces a pathway to liquidity in private markets  

👉 Positioned as a **foundational layer for tokenised real-world assets**.

---

## Disclaimer

This repository is an investor-facing technical overview of the RegenX platform.

Excluded:
- environment variables  
- credentials and private keys  
- production configurations  
- sensitive infrastructure data  

👉 The code reflects structure and capability, not operational secrets.
