# FanDrop

> A multi-service fan-engagement platform — artists run loyalty drops, fans earn
> points, climb a leaderboard, complete quests, and redeem items in a per-artist
> store. Built as a portfolio-grade demonstration of **backend-focused fullstack
> architecture**.

![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2d3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?logo=docker&logoColor=white)

![FanDrop — artist home](assets/screenshots/01-home-desktop.png)

---

## About

FanDrop is a **learning + portfolio hybrid** demonstrating a realistic,
production-shaped **multi-service architecture** for a fan-engagement platform —
not a toy CRUD demo. Artists run loyalty campaigns; fans earn points, climb a
leaderboard, complete quests, and redeem items in a per-artist store.

It deliberately leaves out external SaaS glue (payment providers, hosted error
tracking/analytics) to keep the focus on the **architectural patterns
themselves**: real microservice boundaries, real auth with token rotation, real
WebSocket infrastructure, real type-safe API contracts. It runs **locally only**
(no deploy configs ship in this repo), and the product is **English-only** by
design.

---

## What this project demonstrates

- **Microservices architecture** — two independent NestJS services sharing one
  PostgreSQL database, communicating via **Redis Pub/Sub** (not direct HTTP).
- **Modern monorepo** — pnpm workspaces + Turborepo with shared packages (Prisma
  client, event bus, types, ESLint/TS configs).
- **Production-grade authentication** — passwordless email OTP **and** Google
  OAuth (PKCE); short-lived access JWT + httpOnly refresh cookie with a
  **token-family reuse-detection** pattern; a separate sid-cookie for the
  WebSocket handshake; per-IP **rate limiting** tightened on the OTP endpoints.
- **Real-time updates** — Socket.io with rooms mapping to domain concepts
  (`artist:{id}`, `user:{id}`); cross-service events fan out over Redis Pub/Sub;
  the socket is a **signal to refetch**, never the source of truth.
- **Type-safe API contracts** — OpenAPI 3 generated from NestJS DTOs; TanStack
  Query hooks auto-generated for the React SPA via **Orval** (zero manual
  backend↔frontend type sync).
- **Clean layering, single-source types** — controllers validate and pass DTOs
  straight into services; service return types are **derived from the Prisma
  `select`** (`GetPayload` + `satisfies`) or the response DTO, so no hand-written
  interface duplicates a shape Prisma or a DTO already owns.
- **Polyglot frontend strategy** — Next.js (App Router) as a thin SSR/BFF
  renderer for the public surface; Vite + React SPA for the admin tool; the same
  OpenAPI contract drives the admin client.
- **Shared CLI ↔ HTTP logic** — admin operations exposed through
  `nest-commander` CLI commands that reuse the exact same NestJS services as the
  HTTP controllers, with no duplicated business logic.
- **Ledger-based points** — balances are always `SUM(ledger)`, never an
  overwritten column; purchases, stock, and inventory move in one transaction.

---

## Screenshots

### Public (fan-facing)

| Store                                             | Quests                                              | Profile                                               |
| ------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| ![Store](assets/screenshots/02-store-desktop.png) | ![Quests](assets/screenshots/03-quests-desktop.png) | ![Profile](assets/screenshots/04-profile-desktop.png) |

| Leaderboard                                                                               | Partners                                                                            |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| <img src="assets/screenshots/06-leaderboard-desktop.png" width="420" alt="Leaderboard" /> | <img src="assets/screenshots/05-partners-desktop.png" width="420" alt="Partners" /> |

**Mobile** (mobile-first) — Home, Store & Profile:

<p align="center">
  <img src="assets/screenshots/07-home-mobile.png" width="240" alt="Mobile home" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="assets/screenshots/08-store-mobile.png" width="240" alt="Mobile store" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="assets/screenshots/14-profile-mobile.png" width="240" alt="Mobile profile" />
</p>

The public surface is **mobile-first** and per-viewer: only the artist Home is
public; Store / Profile / Quests are member-only (anonymous visitors get a 404 on
direct access). Avatars are uploaded with an in-browser crop or pulled from
Google sign-in.

### Admin (artist tooling)

| Users                                                                 | Quests                                                          |
| --------------------------------------------------------------------- | --------------------------------------------------------------- |
| ![Admin users](assets/screenshots/09-admin-users-desktop.png)         | ![Admin quests](assets/screenshots/10-admin-quests-desktop.png) |
| **Content editor**                                                    | **Audit log**                                                   |
| ![Quest editor](assets/screenshots/11-admin-quest-editor-desktop.png) | ![Audit log](assets/screenshots/12-admin-audit-desktop.png)     |

The admin is a desktop-only pro tool: sortable/resizable data tables, dirty-state
save forms, and a full audit trail of every mutating action.

### API

![Swagger UI — Admin API](assets/screenshots/13-swagger-admin.png)

OpenAPI 3 is generated from the NestJS DTOs and served as Swagger UI for both
services; the same spec feeds Orval's client generation.

---

## Architecture

```mermaid
flowchart TB
  subgraph Clients
    WP["web-public<br/>Next.js 16 · App Router (BFF)"]
    WA["web-admin<br/>Vite + React 19 SPA"]
  end

  subgraph Services
    AP["api-public · NestJS · :3001<br/>auth · points · store · quests · realtime"]
    AA["api-admin · NestJS · :3002<br/>content CRUD · moderation · audit · CLI"]
  end

  PG[("PostgreSQL 16<br/>shared via @fandrop/db")]
  RD[("Redis 7<br/>sessions · OTP · Pub/Sub")]

  WP -->|"REST + OpenAPI"| AP
  WA -->|"REST + OpenAPI"| AA
  WP <-->|"Socket.io"| AP
  WA <-->|"Socket.io"| AA
  AP --> PG
  AA --> PG
  AP <-->|"Pub/Sub events"| RD
  AA <-->|"Pub/Sub events"| RD
```

**Key boundaries:**

- Each NestJS service owns its domain (auth/commerce on `api-public`,
  CRUD/moderation on `api-admin`). They communicate through Redis Pub/Sub events,
  not direct service-to-service HTTP.
- The shared Prisma client lives in `packages/db` so both services agree on
  schema — the well-known **Shared Database** pattern, a deliberate trade-off for
  a learning project (a larger system would split data per service).
- Next.js is a **thin SSR/BFF renderer**, not a backend. Server Components fetch
  from `api-public`; Server Actions are thin HTTP proxies; no Prisma in Next.js.

### Real-time flow

The socket carries a _signal_, not data — clients always re-read from the
JWT-guarded REST/SSR layer:

```mermaid
sequenceDiagram
  participant Admin as web-admin
  participant AA as api-admin
  participant Redis
  participant AP as api-public
  participant Fan as web-public (fan)

  Admin->>AA: PATCH content (e.g. store item)
  AA->>Redis: publish ARTIST_HOME_UPDATED
  Redis-->>AP: event
  AP-->>Fan: Socket.io "artist.updated" (signal only)
  Fan->>AP: refetch over REST → re-render
```

### Deployment topology (illustrative — not shipped)

FanDrop runs locally (four dev ports), but the URL design assumes a **single apex
domain split by path** behind a reverse proxy:

```
example.app/artist/<slug>   → web-public   (public artist pages)
example.app/admin/<slug>    → web-admin    (artist-admin SPA)
example.app/api/*           → api-public / api-admin
```

The `/admin/` prefix namespaces the admin app, mirroring the public
`/artist/<slug>`, so public and admin stay same-origin (simpler cookies/sessions).

---

## Key technical decisions

### Why two NestJS services instead of a modular monolith

Decomposing public traffic (high RPS, low-privilege) from admin operations (low
RPS, high-privilege) lets each scale and deploy independently, and demonstrates
inter-service eventing and contract sharing. **Trade-off:** the shared DB means
schema changes affect both — accepted for a learning project.

### Why JWT refresh-family + sid-cookie for WebSockets

Short-lived access JWT (in memory) + httpOnly refresh cookie scoped to the
versioned auth route group (`/api/v1/auth`), with a **token family** in Redis:
if an old refresh token is replayed, the whole family is invalidated — kicking
the attacker out without disrupting the user's other sessions. The WebSocket
handshake uses a separate **sid-cookie** (`Path=/socket.io`) instead of passing
the JWT through Socket.io's `auth.token`, which interacts poorly with
long-lived auto-reconnecting sockets.

### Why Prisma multi-file schema

A single `schema.prisma` becomes unwieldy as the domain grows. Prisma 7 splits
the schema by domain (`auth.prisma`, `catalog.prisma`, `ledger.prisma`,
`quests.prisma`, …) under one migration history and one generated client —
easier to review domain-scoped changes. Runtime connects through the
`@prisma/adapter-pg` driver adapter.

### Why OpenAPI codegen with Orval

NestJS DTOs (`class-validator` + `@nestjs/swagger`) are the single source of truth
for API contracts. Orval reads the generated OpenAPI spec and produces TanStack
Query hooks for the SPA. Change a DTO, regenerate, and the frontend types update
with compile errors guiding the migration — zero manual sync.

### Why DTOs flow straight into services (one shape, one owner)

This is a Layered app, so it takes the idiomatic NestJS path: DTOs pass directly
into services rather than being re-mapped onto parallel domain interfaces — that
interface boundary belongs to Clean/Hexagonal, not Layered. Every data shape has
exactly **one owner**: the Prisma `select` for reads (service return types are
derived via `Prisma.XGetPayload<{ select: typeof xSelect }>`) and the
`@ApiProperty` DTO for the wire contract. Nothing hand-written duplicates a shape
Prisma or a DTO already owns, so the three can't drift.

### Why a separate Vite SPA for admin

The admin tool is heavy interactive UI with no SEO need, where sub-second HMR
matters more than initial load — Vite + React + TanStack Router fits. Next.js
stays optimized for the public SSR/ISR surface. Both consume the same OpenAPI
contract, so there are no duplicated types or fetch wrappers.

### Why `nest-commander` for the admin CLI

Operations like creating an artist are exposed both as HTTP endpoints and CLI
commands (`pnpm cli artist:create`). `nest-commander` lets the CLI reuse the
**exact same** NestJS service via DI — no duplicated logic between HTTP and CLI.

---

## Tech stack

| Layer                                       | Technology                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| Language                                    | TypeScript                                                                            |
| Monorepo                                    | pnpm workspaces + Turborepo                                                           |
| Backend framework                           | NestJS 11                                                                             |
| Public frontend                             | Next.js 16 (App Router)                                                               |
| Admin frontend                              | Vite + React 19                                                                       |
| Admin routing / server state / client state | TanStack Router · TanStack Query · Zustand                                            |
| ORM                                         | Prisma 7 (multi-file schema, `prisma-client` generator + pg driver adapter)           |
| Database                                    | PostgreSQL 16                                                                         |
| Cache / Pub-Sub / Sessions / OTP            | Redis 7                                                                               |
| WebSocket                                   | Socket.io 4 (`@nestjs/platform-socket.io` + `socket.io-client`)                       |
| Auth                                        | Email OTP + Google OAuth (PKCE); JWT access/refresh with token-family reuse detection |
| Rate limiting                               | `@nestjs/throttler` — per-IP, tightened on the OTP endpoints                          |
| Email                                       | nodemailer (dev: log transport; Mailtrap sandbox optional)                            |
| File uploads                                | multer + `ServeStaticModule` (avatar crop via `react-easy-crop`)                      |
| API documentation                           | `@nestjs/swagger` (OpenAPI 3)                                                         |
| API client codegen                          | Orval (TanStack Query hooks)                                                          |
| CLI                                         | `nest-commander`                                                                      |
| Styling / UI                                | Tailwind CSS · shadcn/ui (vendored, not a runtime dependency)                         |
| Validation                                  | class-validator + class-transformer + zod (typed env/config)                          |
| Testing                                     | Vitest + supertest + Playwright                                                       |
| Dev infra                                   | Docker Compose (Postgres + Redis)                                                     |

---

## Features

- **Artist Home** — admin-curated sections (promo hero with countdown, "how it
  works", featured store + quests teasers, leaderboard, partners). Per-section
  visibility gating; only Home is public.
- **Store & purchases** — per-artist catalog (points or mock cash), rarity, stock,
  coming-soon timers, loyalty bonuses; atomic purchase → ledger + inventory.
- **Quests** — "visit a link → claim points" with manual claim; featured on Home;
  per-member status; admin can manage a member's quests.
- **Profile** — points balance + history, inventory (stacked), referral program,
  connected socials, avatar upload with crop (or Google avatar).
- **Leaderboard** — live ranking with the viewer's own row and social badges.
- **Auth & onboarding** — passwordless OTP, Google sign-in, first-join welcome
  bonus, referral bonuses.
- **Admin** — content CRUD (data tables + dirty-save modal editors), user
  moderation (adjust points, grant inventory, manage quests, wipe), and an
  **audit log** of every mutating action.
- **Realtime** — admin edits and fan actions propagate live across both surfaces.

---

## Getting started

### Prerequisites

- **Node.js 24** (`.nvmrc` is provided — `nvm use`)
- **pnpm 11** (`npm i -g pnpm`)
- **Docker** (for Postgres + Redis)

### First-time setup

```bash
# 1. Install dependencies
pnpm install

# 2. Bring up Postgres + Redis
docker compose up -d

# 3. Configure environment
cp .env.example .env
# Edit .env — minimum for local dev:
#   DATABASE_URL=postgresql://fandrop:dev@localhost:5432/fandrop
#   REDIS_URL=redis://localhost:6379
#   JWT_ACCESS_SECRET / JWT_REFRESH_SECRET  (e.g. `openssl rand -base64 48`)
#   MAIL_TRANSPORT=log   # OTP codes print to the server console (no email needed)
# Google OAuth + Mailtrap are optional (leave blank to use OTP-over-console).

# 4. Build shared packages + apps. Generates the Prisma client (gitignored),
#    builds the event bus / types, and compiles the apps. Required before the
#    CLI / migrations / dev can resolve @fandrop/* packages.
pnpm build

# 5. Apply the database schema
pnpm --filter @fandrop/db migrate:deploy

# 6. Create your first artist. The CLI reuses the same service as the HTTP
#    endpoint (nest-commander), so this also rebuilds api-admin if needed.
pnpm cli artist:create --name "Aurora" --slug "aurora" --admin-email "admin@aurora.local"

# 7. Seed demo data (fans + balances + Home sections + quests for existing artists)
pnpm --filter @fandrop/db db:seed
```

### Run

```bash
pnpm dev   # Turbo runs all four apps in parallel
```

| Surface              | URL                                 |
| -------------------- | ----------------------------------- |
| Public site          | http://localhost:3000/artist/aurora |
| Admin SPA            | http://localhost:5173/admin/aurora  |
| Public API (Swagger) | http://localhost:3001/docs          |
| Admin API (Swagger)  | http://localhost:3002/docs          |

In local dev each app runs on its own port; `/admin/<slug>` on :5173 is the
SPA's router base path (no reverse proxy involved — the deployment topology
above maps the same URL shape onto one domain in production).

### Sign in (local)

With `MAIL_TRANSPORT=log`, the OTP code is **printed to the server console** — no
email account required.

1. Open the admin SPA and enter `admin@aurora.local` → copy the OTP from the
   console → you're in the admin for Aurora.
2. For the fan experience, open the public site and sign in with a seeded fan
   (e.g. `nova@fans.local`) or any new email (a member is created on first login).

---

## Project structure

```
fandrop/
├── apps/
│   ├── api-public/            # NestJS — public backend (:3001)
│   │   └── src/
│   │       ├── common/        # auth, prisma, redis, mailer, events, config
│   │       └── modules/       # artists, points, store/purchase, quests, avatar, …
│   ├── api-admin/             # NestJS — admin backend (:3002)
│   │   └── src/
│   │       ├── common/        # auth, prisma, uploads, audit, config
│   │       ├── modules/       # promo, store, quests, users, artist-settings, me, …
│   │       └── cli/           # nest-commander commands (artist:create, …)
│   ├── web-public/            # Next.js 16 App Router (thin SSR/BFF, :3000)
│   │   └── src/app/artist/[slug]/   # Home (public) + member-only pages
│   └── web-admin/             # Vite + React 19 SPA (:5173)
│       └── src/
│           ├── api/generated/ # Orval output (generated — do not edit)
│           ├── features/      # feature folders
│           └── routes/        # TanStack Router (file-based)
├── packages/
│   ├── db/                    # Prisma schema (multi-file) + client + seed
│   ├── events/                # Redis Pub/Sub event bus + typed payloads
│   ├── types/                 # shared TypeScript types
│   ├── eslint-config/         # shared ESLint presets
│   └── typescript-config/     # shared tsconfig bases
├── assets/screenshots/        # README media
├── docker-compose.yml
├── pnpm-workspace.yaml
└── turbo.json
```

---

## API documentation & codegen

With `pnpm dev` running, Swagger UI is served per service
(`/docs`) and the raw spec at `/docs-json`. The admin SPA's typed client is
regenerated from the spec:

```bash
cd apps/web-admin && pnpm orval   # regenerates src/api/generated/
```

---

## Testing

The suite favours demonstrating competence across the **testing pyramid** over
chasing coverage numbers — every common layer is represented at a meaningful,
critical point (all on **Vitest**, plus Playwright for browser E2E):

| Layer                     | Tooling                                 | What it covers                                                                                                                                                                                                    |
| ------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend unit              | Vitest + mocked Prisma                  | balance = `SUM(ledger)`; quest-claim `COMPLETED→CLAIMED` idempotency; purchase atomicity (stock decrement, negative `POINTS_SPEND`, loyalty credit, inventory snapshot) + insufficient-funds / sold-out rejection |
| Backend integration (E2E) | Vitest + supertest, real Postgres/Redis | OTP → JWT → refresh-rotation → token-family reuse detection                                                                                                                                                       |
| Frontend unit             | Vitest + React Testing Library (jsdom)  | admin form chrome — live char counter + dirty-field marker                                                                                                                                                        |
| Frontend E2E              | Playwright                              | public Home renders + sign-in modal; member-only page 404s for anonymous visitors                                                                                                                                 |

```bash
# Unit + integration (Vitest). Backend e2e uses a dedicated `fandrop_test` DB.
pnpm test

# Browser E2E (needs `pnpm dev` running)
pnpm --filter @fandrop/web-public test:e2e
```

Both unit layers also include an **inline snapshot** (`toMatchInlineSnapshot`) —
the backend quest view-model and the admin field-header markup — to lock
serialized output / rendered structure against accidental drift, kept inline so
it's reviewed in the diff rather than in an opaque `.snap` file.

> Coverage is not a goal; the point is to show each layer is wired and the
> critical invariants (ledger, idempotency, atomicity, auth rotation) are guarded.

---

## Future improvements

Deliberate omissions, not bugs:

- **Deployment** — currently dev-only; a production story (managed
  Postgres/Redis, container hosting) is the natural next step.
- **Object storage** — `multer` + local `uploads/` today; a `StorageService`
  abstraction targeting S3/MinIO is the production step. (Uploaded media is
  already served through `next/image`: both backends expose `/uploads`, and the
  Next BFF proxies it same-origin via a rewrite, so the optimizer treats it as a
  first-party local image and emits resized WebP — no public CDN host needed.)
- **Observability** — structured logging, error tracking, tracing.
- **Per-service databases** — splitting the shared Postgres along service
  boundaries, with eventual consistency over the existing Pub/Sub bus.
- **Multi-language content** — the product is English-only; a per-artist
  multilingual content model (not UI-locale i18n) would be the productionization
  path.

---

## License

MIT.

## Author

Vadim Stepanov — fullstack engineer.

- GitHub: [@vadim-stepanov](https://github.com/vadim-stepanov)
- LinkedIn: [linkedin.com/in/vadim-stepanov-98936150/](https://www.linkedin.com/in/vadim-stepanov-98936150/)
- Email: vadim.stepanov.mailbox@gmail.com
