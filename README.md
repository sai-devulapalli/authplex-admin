# AuthPlex Admin UI

Admin dashboard for [AuthPlex](https://github.com/sai-devulapalli/authPlex) — a headless Identity & Access Management engine.

React + Vite + TypeScript. Consumes the AuthPlex management API.

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
│                    AuthPlex Server (Go)                            │
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
authplex-admin/
├── src/
│   ├── api/
│   │   └── client.ts          # Typed API client (AuthPlexClient class)
│   ├── context/
│   │   └── AuthContext.tsx     # API key auth context + sessionStorage
│   ├── components/
│   │   ├── Layout.tsx          # Sidebar navigation + header + outlet
│   │   ├── DataTable.tsx       # Generic typed table with pagination
│   │   └── Modal.tsx           # Create/edit modal
│   ├── pages/
│   │   ├── Login.tsx           # API key OR admin email/password login
│   │   ├── Dashboard.tsx       # Tenant count, server health
│   │   ├── Tenants.tsx         # Tenant list + create/delete (paginated)
│   │   ├── TenantDetail.tsx    # Tabs: Users, Clients, Providers, Roles, Audit
│   │   ├── Users.tsx           # User management (SCIM placeholder)
│   │   ├── Clients.tsx         # OAuth client CRUD (paginated)
│   │   ├── Providers.tsx       # Identity provider CRUD
│   │   ├── Roles.tsx           # RBAC role CRUD with permissions
│   │   └── AuditLogs.tsx       # Filterable audit log viewer (paginated)
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

### One Command (Docker)

```bash
docker-compose up
# → AuthPlex server: http://localhost:8080
# → Admin UI:        http://localhost:5173
```

Open http://localhost:5173, enter server URL `http://localhost:8080`, any API key → Connect.

### Manual (Node.js)

**Prerequisites:** Node.js 18+, AuthPlex binary built (`cd ../authPlex && make build`)

```bash
# Terminal 1: Start AuthPlex server
cd ../authPlex
AUTHPLEX_CORS_ORIGINS=http://localhost:5173 ./bin/authplex

# Terminal 2: Start Admin UI
npm install
npm run dev
# → http://localhost:5173
```

### Setting Up Admin Credentials

**Step 1: Start AuthPlex with an admin API key**

```bash
AUTHPLEX_ADMIN_API_KEY=my-secret-key \
AUTHPLEX_CORS_ORIGINS=http://localhost:5173 \
./bin/authplex
```

**Step 2: Bootstrap the first admin (one-time)**

```bash
curl -X POST http://localhost:8080/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password-here",
    "bootstrap_key": "my-secret-key"
  }'
```

The `bootstrap_key` must match `AUTHPLEX_ADMIN_API_KEY`. Creates a `super_admin`. Only works once (when no admins exist).

**Step 3: Login to Admin UI**

Open http://localhost:5173. Two modes:

**API Key mode:**
- Server URL: `http://localhost:8080`
- API Key: `my-secret-key`

**Admin Login mode** (click "Switch to Admin Login"):
- Server URL: `http://localhost:8080`
- Email: `admin@example.com`
- Password: `your-password-here`

### Creating Additional Admins

After bootstrap, a super_admin can create more admins:

```bash
# Login first to get JWT
TOKEN=$(curl -s -X POST http://localhost:8080/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password-here"}' \
  | jq -r '.data.token')

# Create a readonly admin
curl -X POST http://localhost:8080/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "viewer@example.com",
    "password": "password123",
    "role": "readonly"
  }'
```

**Available roles:**

| Role | Access |
|------|--------|
| `super_admin` | Full access to all tenants and operations |
| `tenant_admin` | Scoped to specific tenant(s) only |
| `readonly` | GET-only access to all endpoints |
| `auditor` | Read access to audit logs only |

### Dev Mode (No API Key)

If `AUTHPLEX_ADMIN_API_KEY` is not set, the server skips auth — any value works in the API Key field. For development only.

### Build

```bash
npm run build
# Output: dist/ (~192KB)
```

### Test

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Start AuthPlex server
AUTHPLEX_CORS_ORIGINS=http://localhost:5173 AUTHPLEX_HTTP_PORT=9091 ../authPlex/bin/authplex &

# Run E2E tests
npm run test:e2e
# → 30 tests pass

# Run headed (see browser)
npm run test:e2e:headed
```

## Pages

### Login
Two modes — toggle via "Switch to Admin Login" link:
- **API Key mode:** enter server URL + API key (stored in `sessionStorage`, cleared on tab close)
- **Admin Login mode:** enter server URL + email + password. Calls `POST /admin/login`, receives JWT

### Dashboard
Shows tenant count, server health status, server URL. Quick action to manage tenants.

### Tenants
Full CRUD with create modal (ID, domain, issuer, algorithm RS256/ES256). Click row to open detail view. Delete with confirmation dialog. **Paginated** (20 per page).

### Tenant Detail
Tabbed view with 5 tabs:
- **Users** — User list per tenant (placeholder — requires SCIM backend endpoint `GET /tenants/{tid}/users`)
- **Clients** — OAuth client CRUD (confidential/public, grant types, redirect URIs, scopes). Client secret shown only on creation. **Paginated** (20 per page).
- **Providers** — Identity provider setup (Google, GitHub, Microsoft, Apple, OIDC, OAuth2, SAML).
- **Roles** — RBAC role management with permissions (supports wildcards like `posts:*`).
- **Audit Logs** — Filterable event log with action, actor, resource type filters. **Paginated** (25 per page).

## API Client

The `AuthPlexClient` class in `src/api/client.ts` provides typed methods for all management operations:

```typescript
const client = new AuthPlexClient('http://localhost:8080', 'your-api-key');

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

AuthPlex uses `{data: T}` envelope for management endpoints. The Go backend serializes structs with **PascalCase** field names (no JSON tags on domain entities):

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
| [authPlex](https://github.com/sai-devulapalli/authPlex) | AuthPlex server (Go) — 268 files, 812 tests, 47 endpoints |
| [authplex-java-sdk](https://github.com/sai-devulapalli/authplex-java-sdk) | Java SDK |
| [authplex-dotnet-sdk](https://github.com/sai-devulapalli/authplex-dotnet-sdk) | .NET SDK |
| [authplex-js](https://github.com/sai-devulapalli/authplex-js) | Node.js SDK |
| [authplex-python](https://github.com/sai-devulapalli/authplex-python) | Python SDK |
