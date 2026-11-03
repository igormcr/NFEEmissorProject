# NFEEmissorFront

Frontend for issuing and consulting Nota Fiscal Eletrônica (NFe) — a
lightweight Expo + React web UI that uses the NFEEmissorBFF for authentication,
client management, certificate custody and fiscal operations.

## Overview

NFEEmissorFront is a TypeScript React/Expo frontend that provides an interface
to issue, consult and manage electronic invoices (NFe). It focuses on
multi-client workflows, small business usability and keeping certificate
material out of the device.

## Key Features

- Issue NFe using an external API integration
- Consult status and history of invoices
- Perform NFe consultation, cancellation, carta de correção and inutilização
- Authenticate with the BFF and keep the session across app restarts
- Register and select the client that will issue the NFe
- Upload A1 certificates to the BFF, associate them with clients and display
  certificate metadata/status
- Local certificate catalog for development/demo certificates; private
  certificate material is uploaded to the BFF
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

The app expects the BFF at `http://localhost:3000` by default. To use another
URL, set `EXPO_PUBLIC_BFF_URL` before starting Expo:

```bash
EXPO_PUBLIC_BFF_URL=http://localhost:3000 npm start
```

Open the development URL in the browser to view the app.

## Project Structure (high level)

- `src/app/` : route pages and top-level screens (emitir, consultar, status, certificado, etc.)
- `src/components/` : reusable components and UI primitives
- `src/lib/` : BFF API clients, authentication and certificate helpers
- `src/constants/`, `src/hooks/`, `src/types/` : shared utilities and types

See also: [SKILLS.md](SKILLS.md) and [CONTRIBUTING.md](CONTRIBUTING.md)

## Important Files

- [src/lib/nfe-api.ts](src/lib/nfe-api.ts) — API client for NFe interactions
- [src/lib/auth-api.ts](src/lib/auth-api.ts) — registration, login and current-user API
- [src/lib/certificate-storage.ts](src/lib/certificate-storage.ts) — local metadata helper
- [src/app/emitir.tsx](src/app/emitir.tsx) — issue NFe screen
- [src/app/consultar.tsx](src/app/consultar.tsx) — consult NFe screen
- [src/app/clientes.tsx](src/app/clientes.tsx) — client registration and management
- [src/app/certificado.tsx](src/app/certificado.tsx) — certificate upload and association

## Development notes

- Follow TypeScript types in `src/types/` for payload shapes
- Keep certificate handling secure: do not persist private keys or certificate
  passwords on the device or check them into source control
- The current fiscal integration is NFe. NFS-e support remains tracked in
  `../backlog-nfse-emissor.md` and depends on the provider and municipal rules

## License

This project includes a LICENSE file in the repository root. Follow its terms when contributing or distributing.
