# AuthCore Admin UI

Admin dashboard for [AuthCore](https://github.com/sai-devulapalli/authCore) — a headless Identity & Access Management engine.

React + Vite + TypeScript. Consumes the AuthCore management API.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Admin UI (SPA)                             │
│                                                                   │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────────────┐  │
│  │  Login    │   │  Dashboard   │   │  Tenant Detail          │  │
│  │  Page     │   │  (stats)     │   │  ┌─────────────────┐   │  │
│  └──────────┘   └──────────────┘   │  │ Clients tab     │   │  │
│                                     │  │ Providers tab   │   │  │
│  ┌──────────────────────────────┐  │  │ Roles tab       │   │  │
│  │  Tenants List (CRUD)         │  │  │ Audit Logs tab  │   │  │
│  └──────────────────────────────┘  │  └─────────────────┘   │  │
│                                     └─────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Shared Components: DataTable, Modal, Layout (sidebar)   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Client (typed fetch wrapper with X-API-Key auth)    │   │
│  └────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTP/JSON
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    AuthCore Server (Go)                            │
│                                                                   │
│  Management API (30+ endpoints, API key or JWT auth)              │
│                                                                   │
│  POST/GET    /tenants              Tenant CRUD                    │
│  POST/GET    /tenants/{id}/clients Client CRUD                    │
│  POST/GET    /tenants/{id}/providers Provider CRUD                │
│  POST/GET    /tenants/{id}/roles   Role CRUD                      │
│  POST/DELETE /tenants/{id}/users/{uid}/roles  User role mgmt     │
│  GET         /tenants/{id}/audit   Audit log query                │
│  GET         /health               Health check                   │
│  GET         /metrics              Prometheus metrics             │
│                                                                   │
│  Postgres (17 migrations) + Redis (sessions) + In-memory (dev)   │
└──────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
authcore-admin/
├── src/
│   ├── api/
│   │   └── client.ts          # Typed API client (AuthCoreClient class)
│   ├── context/
│   │   └── AuthContext.tsx     # API key auth context + sessionStorage
│   ├── components/
│   │   ├── Layout.tsx          # Sidebar navigation + header + outlet
│   │   ├── DataTable.tsx       # Generic typed table component
│   │   └── Modal.tsx           # Create/edit modal
│   ├── pages/
│   │   ├── Login.tsx           # API key + server URL input
│   │   ├── Dashboard.tsx       # Tenant count, server health
│   │   ├── Tenants.tsx         # Tenant list + create/delete
│   │   ├── TenantDetail.tsx    # Tabs: Clients, Providers, Roles, Audit
│   │   ├── Clients.tsx         # OAuth client CRUD
│   │   ├── Providers.tsx       # Identity provider CRUD
│   │   ├── Roles.tsx           # RBAC role CRUD with permissions
│   │   └── AuditLogs.tsx       # Filterable audit log viewer
│   ├── types.ts                # TypeScript interfaces
│   ├── App.tsx                 # Router + auth guard
│   ├── main.tsx                # Entry point
│   └── index.css               # Clean admin theme (no CSS framework)
├── e2e/
│   ├── helpers.ts              # Login helper, test constants
│   ├── login.spec.ts           # 6 tests: form, connect, error, logout
│   ├── dashboard.spec.ts       # 5 tests: stats, health, navigation
│   ├── tenants.spec.ts         # 7 tests: CRUD, modal, delete
│   └── tenant-detail.spec.ts   # 12 tests: tabs, clients, roles, audit
├── playwright.config.ts        # Chromium, auto-start servers
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Quick Start

### Prerequisites

- Node.js 18+
- AuthCore server running (see [authCore](https://github.com/sai-devulapalli/authCore))

### Development

```bash
# Install dependencies
npm install

# Start AuthCore server (in another terminal)
cd ../authCore
AUTHCORE_CORS_ORIGINS=http://localhost:5173 ./bin/authcore

# Start dev server
npm run dev
# → http://localhost:5173
```

Open the browser, enter:
- **Server URL:** `http://localhost:8080` (or wherever AuthCore is running)
- **API Key:** your admin API key (or any value if `AUTHCORE_ADMIN_API_KEY` is not set)

### Build

```bash
npm run build
# Output: dist/ (~192KB)
```

### Test

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Start AuthCore server
AUTHCORE_CORS_ORIGINS=http://localhost:5173 AUTHCORE_HTTP_PORT=9091 ../authCore/bin/authcore &

# Run E2E tests
npm run test:e2e
# → 30 tests pass

# Run headed (see browser)
npm run test:e2e:headed
```

## Pages

### Login
API key stored in `sessionStorage` — cleared when tab closes.

### Dashboard
Shows tenant count, server health status, server URL. Quick action to manage tenants.

### Tenants
Full CRUD with create modal (ID, domain, issuer, algorithm RS256/ES256). Click row to open detail view. Delete with confirmation dialog.

### Tenant Detail
Tabbed view with:
- **Clients** — OAuth client CRUD (confidential/public, grant types, redirect URIs, scopes). Client secret shown only on creation.
- **Providers** — Identity provider setup (Google, GitHub, Microsoft, Apple, OIDC, OAuth2, SAML).
- **Roles** — RBAC role management with permissions (supports wildcards like `posts:*`).
- **Audit Logs** — Filterable event log with action, actor, resource type filters and pagination.

## API Client

The `AuthCoreClient` class in `src/api/client.ts` provides typed methods for all management operations:

```typescript
const client = new AuthCoreClient('http://localhost:8080', 'your-api-key');

// Tenants
const { tenants, total } = await client.listTenants();
await client.createTenant({ id: 'acme', domain: 'acme.com', issuer: 'https://auth.acme.com', algorithm: 'RS256' });
await client.deleteTenant('acme');

// Clients
const { clients } = await client.listClients('acme');
const newClient = await client.createClient('acme', { client_name: 'Web App', ... });

// Roles
await client.createRole('acme', { name: 'admin', permissions: ['*'] });

// Audit
const { events } = await client.queryAudit('acme', { action: 'login_success', limit: 50 });
```

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite 6 | Build tool (fast HMR, ~192KB production bundle) |
| TypeScript | Type safety |
| React Router 6 | Client-side routing |
| Playwright | E2E browser testing (30 tests) |
| CSS (no framework) | Clean minimal admin theme |

## API Response Format

AuthCore uses `{data: T}` envelope for management endpoints. The Go backend serializes structs with **PascalCase** field names (no JSON tags on domain entities):

```json
{
  "data": {
    "ID": "tenant-1",
    "Domain": "example.com",
    "Issuer": "https://auth.example.com",
    "SigningConfig": { "Algorithm": "RS256" },
    "CreatedAt": "2026-03-29T10:00:00Z"
  }
}
```

## Related Repositories

| Repository | Description |
|-----------|-------------|
| [authCore](https://github.com/sai-devulapalli/authCore) | AuthCore server (Go) — 268 files, 812 tests, 47 endpoints |
| [authcore-java-sdk](https://github.com/sai-devulapalli/authcore-java-sdk) | Java SDK |
| [authcore-dotnet-sdk](https://github.com/sai-devulapalli/authcore-dotnet-sdk) | .NET SDK |
| [authcore-js](https://github.com/sai-devulapalli/authcore-js) | Node.js SDK |
| [authcore-python](https://github.com/sai-devulapalli/authcore-python) | Python SDK |
