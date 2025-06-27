# Kohaku Testnet Roadmap

<aside>
🚢

Each release includes a public tweet, a Kohaku extension update, open-source code, and documentation. The features and scope outlined in releases beyond v0.0.2 represent our current direction and priorities, but may evolve as development and integration efforts progress.

</aside>

### **v0.0.1: Interop Foundation**

**Scheduled for:** July, 2025

**Goal**: Enable interoperable addressing and basic cross-chain UX

### Main Features

1. **ERC-7828**: human-readable interoperable address resolution (via GitHub chain list)
2. **ERC-7930**: binary serialization support for intent protocols
3. **Cross-chain sends**: via **OIF** + **Across**
4. **Universal balance views**: display aggregation of same-asset balances across chains

---

### **v0.0.2: Private Sends & Cross-Chain Swaps**

**Scheduled for:** October, 2025

**Goal**: Introduce Privacy Pools and enable seamless cross-chain swaps

### Main Features

1. **Private send** natively through the wallet via Privacy Pools (ETH sepolia mainnet support only)
2. **Cross-chain swaps**
3. **Universal balance transactions:** support intents where sender holds assets on multiple chains and destination receives a unified amount (chain-agnostic sender)

---

### **v1.0.0: Private Payments & Abstraction Layer**

**Scheduled for:** December, 2025

**Goal**: Support unified payments and private receive

### Main Features

1. **Private receive** natively through the wallet via Privacy Pools and Stealth Addresses (ETH sepolia mainnet support only)
2. **Stablecoin aggregation**: combine DAI/USDC/USDT as a single spendable “cash” balance
3. **Payment request**

---

### **v1: Abstraction Core with Privacy by Design**

**Scheduled for:** January–August, 2026

**Goal:** Advance toward a new wallet paradigm with native privacy and intuitive UX through abstraction and recovery standards

### Focus areas to be prioritized

1. **Address abstraction**: support for different address per app default flows to enhance app-level isolation and privacy
2. **ERC-7702 social recovery**: native support for smart EOA recovery, including zk-wrapped guardians
3. **Session keys & gas abstraction**: reduce friction for recurring transactions and enable delegated signing; includes automated private balance top-ups
4. **Cross-chain private calls**: shielded transfers and interactions between L2s and mainnet
5. **RPC privacy layer**: strengthen metadata protection across wallet operations
6. **Universal dApp calls**: allow seamless interactions with dApps regardless of asset location or chain
7. **Hardware wallet support**: enable secure signing for privacy-preserving transactions
8. **ERC-4337 private relayer**: fully integrated with Privacy Pools for seamless private user operations
