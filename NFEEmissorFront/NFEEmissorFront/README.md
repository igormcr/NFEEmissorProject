# NFEEmissorFront

Frontend for issuing and consulting Nota Fiscal Eletrônica (NFe) — a lightweight Expo + React web UI for interacting with the NFe API and managing certificates.

## Overview

NFEEmissorFront is a TypeScript React/Expo frontend that provides an interface to issue, consult and manage electronic invoices (NFe). It focuses on small business usability and secure certificate handling.

## Key Features

- Issue NFe using an external API integration
- Consult status and history of invoices
- Local certificate storage and management
- Responsive UI with web support (React + Expo)

## Quickstart

Prerequisites:

- Node.js 18+ and npm or yarn
- (Optional) Expo CLI for native/mobile testing

Install dependencies:

```bash
npm install
# or
yarn install
```

Run the app in web mode:

```bash
npm start
# or
yarn start
```

Open the development URL in the browser to view the app.

## Project Structure (high level)

- `src/app/` : route pages and top-level screens (emitir, consultar, status, certificado, etc.)
- `src/components/` : reusable components and UI primitives
- `src/lib/` : API client and certificate storage helpers
- `src/constants/`, `src/hooks/`, `src/types/` : shared utilities and types

See also: [SKILLS.md](SKILLS.md) and [CONTRIBUTING.md](CONTRIBUTING.md)

## Important Files

- [src/lib/nfe-api.ts](src/lib/nfe-api.ts) — API client for NFe interactions
- [src/lib/certificate-storage.ts](src/lib/certificate-storage.ts) — certificate storage helper
- [src/app/emitir.tsx](src/app/emitir.tsx) — issue NFe screen
- [src/app/consultar.tsx](src/app/consultar.tsx) — consult NFe screen

## Development notes

- Follow TypeScript types in `src/types/` for payload shapes
- Keep certificate handling secure: use secure storage and never check private keys into source control

## License

This project includes a LICENSE file in the repository root. Follow its terms when contributing or distributing.
