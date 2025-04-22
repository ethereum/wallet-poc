> **⚠️ Experimental Wallet Warning ⚠️**
>
> This wallet is highly experimental and under active development.
> **DO NOT USE IT FOR PRODUCTION PURPOSES OR TO STORE REAL FUNDS.**
> Use only test funds for evaluation and feedback.
> The developers assume NO responsibility for any loss of funds.

# Experimental Interoperable Wallet

## Features

- **ERC-7930 Support:** Implements interoperable addresses. See the [Technical Design Document](docs/erc-7930-implementation.md) for details.
- **Smart Account Wallet:** Leverage the power of account abstraction for enhanced security and usability.
- **Cross-Platform:** Built with React Native Web for cross-browser extensions, mobile apps (future), and web apps from a single codebase.
- **EIP-7702 Ready:** Prepared for the next generation of Ethereum account standards.
- **Cross-Chain Focus:** Designed for seamless interaction across multiple blockchain networks.
- **Integrated Tools:** Includes Benzin (transaction explorer) and Ambire Legends (gamified testing app).

## Getting Started

### Prerequisites

- Node.js (check `.nvmrc` for recommended version)
- Yarn (v1.x)
- Git
- Familiarity with [React Native development environment setup](https://reactnative.dev/docs/environment-setup).

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/AmbireTech/ambire-wallet.git # Replace with actual repo URL if different
    cd ambire-wallet
    ```

2.  **Install dependencies:**

    ```bash
    yarn install
    ```

3.  **Initialize and update submodules (ambire-common):**

    ```bash
    git submodule init
    git submodule update
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root directory by copying `.env-sample`:
    ```bash
    cp .env-sample .env
    ```
    Fill in the necessary variables in your `.env` file.

### Editor Setup

Ensure your code editor has plugins that support the following configuration files for linting, formatting, and import sorting:

- `.editorconfig`
- `.prettierrc`
- `tsconfig.json`
- `eslintrc.js`
- `import-sorter.json`

## Development

### Running the Browser Extension (Webkit)

Start the development server with hot-reloading for Webkit browsers (Chrome, Brave, etc.):

```bash
yarn web:webkit
```

Then, load the unpacked extension from the `build/webkit-dev` directory:

- **Chrome/Brave/Edge:** Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", and select the `build/webkit-dev` folder.
- **Other Browsers:** Follow their specific instructions for loading unpacked extensions.

## Building for Production

### Browser Extensions

- **Build for Webkit:**
  Creates a production-optimized build.

  ```bash
  yarn build:web:webkit
  ```

  Output directory: `build/webkit-prod`

- **Export Source Maps (Webkit):**
  Extracts source maps into a separate directory (`build/webkit-prod-source-maps`) and removes them from the main build directory. This is useful for store submissions while keeping source maps for debugging.

  ```bash
  yarn export:web:webkit:sourcemaps
  ```

- **Prepare Store-Ready Builds:**
  Automates the process of building, cleaning source maps, and zipping the extensions for store submission.
  ```bash
  yarn build:extensions
  ```
  Find the zipped builds (`ambire-extension-<VERSION>-<TYPE>.zip`) in the `build` folder.

## Related Tools

### Benzin (Transaction Explorer)

Ambire's human-readable transaction explorer for ERC-4337 and contract interactions.

- **Run in Development:**

  ```bash
  yarn web:benzin
  ```

  Output directory: `build/benzin-dev`

- **Build for Production:**
  ```bash
  yarn build:web:benzin
  ```
  Output directory: `build/benzin-prod`

### Ambire Legends (Gamified Testing App)

A Web3 app designed to test Ambire browser extensions through an on-chain adventure. [Read more](https://legends.ambire.com/).

- **Run in Development:**

  ```bash
  yarn web:legends
  ```

  Output directory: `build/legends-dev`

- **Build for Production:**
  ```bash
  yarn build:web:legends
  ```
  Output directory: `build/legends-prod`

## 🤝 Contributing

Interoperable Wallet was built with ❤️ by [Wonderland](https://wonderland.xyz).

Wonderland is a team of top Web3 researchers, developers, and operators who believe that the future needs to be open-source, permissionless, and decentralized.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes using conventional commits
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request
