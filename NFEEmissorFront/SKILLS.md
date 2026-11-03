# Project Skills & Technologies

This document lists the primary technologies, skills, and knowledge areas used by NFEEmissorFront.

- **TypeScript**: strong typing across the app, interfaces in `src/types/`.
- **React (Web) + Expo**: UI and routing built with React and the Expo router.
- **React Native Web**: cross-platform UI components and web support.
- **CSS Modules**: component-scoped styles (see `src/components/*.module.css`).
- **Certificate Management**: handling X.509 certificates and private keys securely via `src/lib/certificate-storage.ts`.
- **HTTP/REST APIs**: communication with backend NFe services via `src/lib/nfe-api.ts` (fetch/axios patterns).
- **State & Hooks**: idiomatic React hooks in `src/hooks/` and local component state.
- **Build & Tooling**: Node.js, npm/yarn, Expo CLI for local development and builds.
- **UX/Accessibility**: focus on readable forms, responsive layout and accessible controls.
- **Domain Knowledge**: Brazilian NFe process (issuance, consultation, status codes) — useful for contributors working on invoice flows.

If you have experience in any of the above areas, you'll be able to contribute effectively. For domain-specific tasks (NFe rules and tax regimes), familiarity with Brazilian electronic invoicing and government APIs is especially helpful.
