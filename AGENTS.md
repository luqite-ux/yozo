# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

B2B export/trade enterprise website template (monorepo). Three sub-packages:

| Package | Path | Dev command | Port | Purpose |
|---------|------|------------|------|---------|
| Website | `website/` | `npm run dev` (or root `npm run dev:website`) | 5173 | Vite + React 19 frontend |
| Studio | `studio/` | `npm run dev` (or root `npm run dev:studio`) | 3333 | Sanity Studio v3 CMS |
| Webhook | `webhook/` | `npm run dev` | 3001 | Translation webhook (optional) |

All content persistence is via **Sanity.io cloud** — no local database required.

### Environment variables

All required secrets (`VITE_SANITY_PROJECT_ID`, `SANITY_PROJECT_ID`, `SANITY_API_WRITE_TOKEN`, `SANITY_STUDIO_PROJECT_ID`, etc.) are injected as environment variables by the Cloud Agent platform. Before starting dev servers, create `.env` files from these env vars:

```bash
# website/.env
cat > website/.env << EOF
VITE_SANITY_PROJECT_ID=$VITE_SANITY_PROJECT_ID
VITE_SANITY_DATASET=$VITE_SANITY_DATASET
VITE_SANITY_API_VERSION=$VITE_SANITY_API_VERSION
VITE_SANITY_USE_CDN=$VITE_SANITY_USE_CDN
SANITY_PROJECT_ID=$SANITY_PROJECT_ID
SANITY_DATASET=$SANITY_DATASET
SANITY_API_VERSION=$VITE_SANITY_API_VERSION
SANITY_API_WRITE_TOKEN=$SANITY_API_WRITE_TOKEN
EOF

# studio/.env
cat > studio/.env << EOF
SANITY_STUDIO_PROJECT_ID=$SANITY_STUDIO_PROJECT_ID
SANITY_STUDIO_DATASET=$SANITY_STUDIO_DATASET
EOF
```

### Key commands (from root)

See `package.json` scripts. Summary:

- **Lint**: `npm run lint:website`
- **Schema validation**: `npm run validate:studio`
- **Build website**: `npm run build:website`
- **Build studio**: `npm run build:studio`
- **Dev website**: `npm run dev:website` (port 5173)
- **Dev studio**: `npm run dev:studio` (port 3333)
- **Sanity read verification**: `npm run verify:read` (requires `VITE_SANITY_PROJECT_ID`)

### Gotchas

- Each sub-package (`website/`, `studio/`, `webhook/`) uses its own `package-lock.json` and needs a separate `npm install`. There is no root lockfile or workspace hoisting.
- Sanity Studio requires authentication (Google/GitHub/email) to access the CMS interface — the login screen at localhost:3333 is expected behavior, not an error.
- The website uses a Vite dev proxy (`/__sanity-apicdn`) to avoid CORS issues with Sanity CDN in local development.
- The inquiry form POST (`/api/inquiries`) is handled by `vite-plugin-inquiry-api.js` during local dev; it requires `SANITY_API_WRITE_TOKEN` (without `VITE_` prefix) to write to Sanity.
- `studio/sanity.project.constants.js` has a fallback project ID; the `.env` / environment variable `SANITY_STUDIO_PROJECT_ID` takes precedence.
