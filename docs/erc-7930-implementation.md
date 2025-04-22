# ERC-7930 Interoperable Address Implementation

### Overview

This technical design document outlines the implementation of [ERC-7930](https://github.com/ethereum/ERCs/pull/1002) Interoperable Addresses into an existing wallet application (Ambire). The goal is to enhance cross-chain interoperability by implementing human-readable addresses that contain chain information, allowing for a more seamless user experience when sending assets across different chains.

### Terminology

- [**ERC-7930**](https://github.com/ethereum/ERCs/pull/1002): Proposal for standardizing interoperable addresses
- **Chain-specific Address or Interoperable Address**: Human-readable address format defined by [ERC-7930](https://github.com/ethereum/ERCs/pull/1002) that contains chain information

### Objectives

- Extend current wallet functionality to support [ERC-7930](https://github.com/ethereum/ERCs/pull/1002) interoperable addresses
- Minimize UI changes while improving user experience for cross-chain transactions
- Create a reusable implementation that can be shared with the broader ecosystem
- Maintain backward compatibility with existing address formats (ENS, EVM addresses)

# Implementation Roadmap

## 1. Transfer Functionality Enhancements

### Current Implementation

The transfer function currently allows users to select a token-chain pair and the destination address for transfers.

### Part 1: Interoperable Address Support in Transfer Page

- Enhance the transfer function to accept interoperable addresses that contain embedded chain information
- When an interoperable address is entered, automatically select the associated chain
- Filter token selection to show only tokens available on the detected chain
- Maintain existing address format support for backward compatibility

### Part 2: Intent Standard and Adapter Contract in Transfer Page

- Implement a toggle in the transfer page that enables advanced cross-chain interactions
- Allow users to select any token from their portfolio across different chains
- Process transfers to the destination token and chain specified by the interoperable address
- Leverage the Intent Standard and Adapter Contract to facilitate cross-chain transfers

## 2. Swap and Bridge Functionality Enhancements

### Current Implementation

The swap and bridge function allows users to select a token-chain pair from available balances, then choose the desired destination token and chain. Users cannot currently modify the recipient of the funds.

### Part 1: Interoperable Address Support

- Add a toggle enabling users to input an interoperable address for the recipient
- When an interoperable address is entered, lock the destination chain to match the address
- Users will still select the source token-chain and destination token
- Maintain the current flow for users who prefer not to use interoperable addresses

### Part 2: Intent Interface Integration

- Replace current Li.Fi implementations with our intent interface and adapter contract
- Create a unified transaction flow regardless of source or destination chains
- Improve transaction transparency and tracking for cross-chain operations

## 3. Account History Enhancements

### Current Implementation

Currently, the signTx, loadingTx, and successTx screens/modals are similar for send, swap, and bridge operations. There is no specific design for cross-chain operations, and only initial transaction data is displayed.

### Part 1: UI Differentiation for Cross-chain Operations

- Modify the current interface to visually differentiate cross-chain operations
- Leverage transaction data stored in the wallet's localStorage to enhance the display
- Add specific indicators and status trackers for cross-chain transactions

## Technical Implementations

- [Interop SDK]()
- [Receive Modal Changes]()
- [Transfer Page (Part 1): Interop Addy Support]()
- [Transfer Page (Part 2): Interop Transfer Functionality]()
- [Swap & Bridge (Part 1): Interop Addy Support]()
- [Swap & Bridge (Part 2): Intent Interface Integration]()
- [Account History (Part 1)]()

## Design Criteria

### Modular Architecture Approach

The implementation will follow a modular architecture centered around a unified transaction hook system. This approach will offer:

1. **Unified Interface**: A consistent API for different transaction types
2. **Separation of Concerns**: Transaction logic is decoupled from UI components, making both easier to test and maintain
3. **Extensibility**: New transaction types can be added without modifying existing functionality
4. **Reusability**: Core utilities can be shared across different features of the application
