# Contributing

1. Use Node.js 22 or newer and install dependencies with `pnpm install`.
2. Make focused changes with tests.
3. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run privacy`.
4. Do not commit credentials, real home paths, session identifiers, or screenshots containing personal terminal data.

Terminal adapters must call public Harness services. Do not write directly to dsh storage files or duplicate Web business logic.
