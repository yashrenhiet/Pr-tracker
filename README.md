# PR Tracker

Track pull requests across repositories and (soon) run AI-assisted code reviews on them.

> **Status:** phase 3. Backend CRUD API and the dashboard UI are in place; the AI review engine is
> not built yet. See [Roadmap](#roadmap).

## Layout

```
prTracker/
├── backend/             Spring Boot 4 (Java 21) + PostgreSQL + Flyway
├── frontend/            React + Vite dashboard, Redux Toolkit (RTK Query), Express BFF
├── docker-compose.yml   Local PostgreSQL (works with Docker or Podman)
└── .env.example         Configuration template
```

## Prerequisites

- Java 21, Maven 3.9+
- PostgreSQL 16, either installed locally or in a container (Podman or Docker)

### Option A: local PostgreSQL (macOS, simplest)

```bash
brew install postgresql@16 && brew services start postgresql@16
createuser -s prtracker
createdb -O prtracker prtracker        # app database
createdb -O prtracker prtracker_test   # throwaway database for tests (wiped on every run)
```

### Option B: Podman (macOS, one time)

```bash
brew install podman podman-compose
podman machine init
podman machine start
```

Testcontainers needs to find Podman's socket. Add to your shell profile:

```bash
export DOCKER_HOST="unix://$(podman machine inspect --format '{{.ConnectionInfo.PodmanSocket.Path}}')"
export TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock
export TESTCONTAINERS_RYUK_DISABLED=true
```

Ryuk (Testcontainers' cleanup container) is unreliable on Podman; disabling it only means stray
test containers are not reaped if the JVM is killed. Remove them with `podman container prune`.

## Quick start

```bash
cp .env.example .env                 # then set POSTGRES_PASSWORD / DB_PASSWORD
podman-compose up -d postgres        # skip if using local PostgreSQL (option A)
cd backend
set -a && source ../.env && set +a   # export DB_* for the app
mvn spring-boot:run                  # Flyway creates the schema on startup
curl localhost:8081/actuator/health
```

## Tests

```bash
cd backend
TEST_DB_URL=jdbc:postgresql://localhost:5432/prtracker_test mvn test   # option A
mvn test                                                              # option B (Testcontainers)
```

Unit tests always run. The API and schema tests need PostgreSQL:

- **`TEST_DB_URL` set** (plus optional `TEST_DB_USERNAME`, default `prtracker`, and
  `TEST_DB_PASSWORD`): the tests use that database, and **drop and recreate its `public` schema
  first**. Only point it at a throwaway database.
- **Otherwise**, Testcontainers starts a throwaway PostgreSQL if a container runtime is reachable.
- **Neither available:** those tests are skipped, not passed. Check `target/surefire-reports` if
  in doubt.

## API

All endpoints are under `/api`. Errors use [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)
problem JSON (`{"status":409,"detail":"..."}`). Validation errors (400) also list each failed
field: `"errors":[{"field":"email","message":"must be a well-formed email address"}]`.
Timestamps are UTC ISO-8601 instants (`2026-09-25T13:43:18.809Z`).

### Reviews

| Method | Path                       | Notes                                                    |
|--------|----------------------------|----------------------------------------------------------|
| GET    | `/reviews`                 | Filter + paging, see below                               |
| POST   | `/reviews`                 | `prUrl`, `component`, `raisedBy` required                |
| GET    | `/reviews/{id}`            |                                                          |
| PATCH  | `/reviews/{id}`            | Partial update; omitted fields are unchanged             |
| PUT    | `/reviews/{id}/status`     | `{"status":"BLOCKED","blockReason":"..."}`               |
| DELETE | `/reviews/{id}`            |                                                          |

`GET /reviews` query parameters (all optional):
`status` (comma-separated), `raisedBy`, `reviewer` (matches internal or platform reviewers),
`component`, `createdFrom` / `createdTo` (ISO-8601 with offset, `createdTo` exclusive),
`page` (default 0), `size` (1-100, default 20),
`sort` (`createdAt|updatedAt|status|raisedBy|component`, default `updatedAt`),
`direction` (`ASC|DESC`, default `DESC`).

Behaviour worth knowing:

- PR URLs are canonicalised: `.../pull/7/files?x=1` is stored as `.../pull/7`, and the same PR
  cannot be tracked twice (409).
- `PATCH` accepts an optional `version`; if it does not match, you get 409 instead of silently
  overwriting someone else's change.
- `BLOCKED` requires a `blockReason`; any other status clears it.
- Reviewer lists are trimmed and deduplicated ignoring case. `metadata` is a free-form
  string map for things like ticket IDs.

Statuses: `READY_FOR_REVIEW`, `REVIEW_IN_PROGRESS`, `COMMENTS_ADDED`, `COMMENTS_ADDRESSED`,
`APPROVED`, `MERGED`, `BLOCKED`, `BOT_REVIEW_COMPLETED`, `READY_FOR_PLATFORM_REVIEW`,
`BOT_REVIEW_REJECTED`, `CLOSED`.

### Reviewers and components

| Method | Path                                      | Notes                         |
|--------|-------------------------------------------|-------------------------------|
| GET    | `/reviewers`                              | Sorted by name                |
| POST   | `/reviewers`                              | `name`, `email`, `handle`     |
| DELETE | `/reviewers/{id}`                         | Also removes grants           |
| PUT    | `/reviewers/{id}/components/{component}`  | Grant (idempotent)            |
| DELETE | `/reviewers/{id}/components/{component}`  | Revoke (idempotent)           |
| GET    | `/components`                             | All known component names     |

Emails, handles and component grants are unique ignoring case.

## Frontend

```bash
cd frontend
npm install
npm run dev              # Vite dev server on :5173, proxies /api to the backend on :8081
```

Open http://localhost:5173 once the backend (see Quick start above) is running. There are two
pages: the reviews dashboard (filter, add, edit, change status, delete) and reviewer management
(add reviewers, grant/revoke the components they can see).

A small Express BFF (`frontend/server`) proxies `/api` to the backend and serves the built app as a
single-page app, for a production-style run instead of the Vite dev server:

```bash
npm run build          # frontend -> frontend/dist
npm run server:build   # BFF -> frontend/dist-server
BACKEND_URL=http://localhost:8081 PORT=3000 npm run server:start
```

The UI kit (`src/components/ui`) is plain CSS Modules over a small token palette in
`src/styles/tokens.css` — no external component library. Server state (reviews, reviewers,
components) is owned by one RTK Query API slice (`src/store/api.ts`); there's no hand-rolled
loading/error state to keep in sync.

## Data model

| Table                | Purpose                                                      |
|----------------------|--------------------------------------------------------------|
| `pr_review`          | One row per tracked PR: status, reviewers, context, metadata |
| `reviewer`           | People who can be assigned as platform reviewers             |
| `reviewer_component` | Which components each reviewer covers                        |

## Roadmap

1. Scaffold: repo, docker-compose, Flyway schema (done)
2. Backend CRUD API: reviews, reviewers, components (done)
3. Frontend dashboard + BFF (done)
4. Review engine: Anthropic/OpenAI via Spring AI, GitHub MCP with REST fallback, scheduler
5. Extras: verification pass, missed-findings audit, staged reviews

## License

[MIT](LICENSE)
