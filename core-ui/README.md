# RegenX

RegenX is a blockchain-powered investment platform designed to democratize access to climate-positive projects. Built on the Stellar blockchain and leveraging Soroban smart contracts, RegenX enables fractional ownership of renewable energy projects, providing transparency, real-time tracking of performance and carbon impact, and liquidity for investors and project developers alike.

## Features

- React
- Vite
- Tailwind CSS
- React Router
- ESLint
- Prettier
- Husky
- lint-staged
- EditorConfig
- Cypress with code coverage

## Setup

> ⚠️ We recommend using [Visual Studio Code](https://code.visualstudio.com/) along with extensions for [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode), [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint), and [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig) for development.

> ⚠️ We recommend using Node.js 18.x. You can manage versions using [nvm](https://github.com/nvm-sh/nvm).

### Installation

1. Install dependencies:
   ```sh
   npm install
   ```
2. Prepare environment variables:
   ```sh
   npm run dev:prepare
   ```
   This command copies the contents of `.env.dist` into a `.env` file and populates it. Ensure that all environment variables have the prefix `VITE_`.

   Example:
   ```sh
   VITE_API_BASE_URL=https://api.example.com
   ```

## How to Run

### Development Mode
```sh
npm run start:dev
```

### Production Mode
```sh
npm run build # Create a production build
npm run start:prod # Run the app in production
```

## Testing

```sh
npm run test:ui       # Run UI tests in headless mode
npm run test:ui:dev   # Run UI tests in browser mode
```

## Useful Commands

```sh
npm run lint    # Run linter
npm run format  # Run formatter
```

## Issues

Files that are not tested appear in the final Cypress report as having "empty" coverage, displaying 0% coverage.

![Coverage Report](https://user-images.githubusercontent.com/60404954/236656815-84ee0d06-8375-4509-9578-c8ff2436c9c2.png)

- Related issues:
  - https://github.com/cypress-io/code-coverage/issues/539
  - https://github.com/cypress-io/code-coverage/issues/552

## References

- [React Docs](https://react.dev/learn)
- [Vite Docs](https://vitejs.dev/guide/)
- [Vite + Tailwind Setup](https://tailwindcss.com/docs/guides/vite)
- [React Router Docs](https://reactrouter.com/en/main)
- [ESLint + Prettier + EditorConfig Setup](https://dev.to/npranto/how-i-setup-eslint-prettier-and-editorconfig-for-static-sites-33ep)
- [Husky Docs](https://github.com/typicode/husky)
- [lint-staged Docs](https://github.com/okonet/lint-staged)
- [Vite Path Aliasing](https://dev.to/avxkim/setup-path-aliases-w-react-vite-ts-poa)
- [Cypress Docs](https://docs.cypress.io/guides/overview/why-cypress)
- [Vite + React + Cypress + Coverage](https://medium.com/@nelfayran/cypress-react-and-vite-collaboration-bed6761808fc)
- [@cypress/code-coverage Docs](https://github.com/cypress-io/code-coverage)
- [nyc Docs](https://github.com/istanbuljs/nyc)
