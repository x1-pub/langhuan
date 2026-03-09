# LangHuan Hub

[简体中文](README.zh-CN.md) | [English](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node >= 22.12](https://img.shields.io/badge/Node-%3E%3D22.12-339933?logo=node.js&logoColor=white)
![pnpm workspace](https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white)

LangHuan Hub is an open-source web database management platform focused on maintainability, extensibility, and contributor-friendly engineering workflows.

## Highlights

- Unified workspace for MySQL, MariaDB, PostgreSQL, Redis, and MongoDB.
- Native-style shell page for direct database command execution.
- Visual database operations for tables, documents, indexes, and key-value data.
- Strict TypeScript monorepo with shared schema/types via `packages/*`.
- Built-in UI localization: English, Simplified Chinese, Japanese, and Korean.

## Supported Databases

- MySQL
- MariaDB
- PostgreSQL
- Redis
- MongoDB

## Tech Stack

| Layer       | Stack                                            |
| ----------- | ------------------------------------------------ |
| Frontend    | React 19, Vite, Ant Design, TanStack Query, Less |
| Backend     | Fastify, tRPC, Drizzle ORM                       |
| Shared      | TypeScript, Zod, pnpm workspace                  |
| Dev Quality | ESLint, Prettier, Husky, lint-staged             |

## Repository Structure

```text
langhuan/
├── client/            # React frontend application
├── server/            # Fastify + tRPC backend service
├── packages/          # Shared types/zod modules
├── .github/           # GitHub workflows and community templates
├── .husky/            # Git hooks
├── CONTRIBUTING.md    # Contribution guidelines
├── SECURITY.md        # Security policy
└── pnpm-workspace.yaml
```

## Quick Start

### Prerequisites

- Node.js >= `22.12`
- pnpm >= `8` (recommended via `corepack enable`)
- Running database instances for the engines you want to connect

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Key server environment variables:

- `DATABASE_URL`: metadata database for storing connection records.
- `SERVER_HOST`: server bind host (default `0.0.0.0`).
- `SERVER_PORT`: server bind port (default `7209`).
- `CORS_ORIGINS`: comma-separated origin whitelist. Use `*` only for local development.

### 3. Run database migrations

```bash
pnpm --filter server db:migrate
```

### 4. Start development

```bash
pnpm dev
```

Default runtime:

- Client: `http://localhost:5173` (Vite default)
- Server: `http://localhost:7209` (or your configured `SERVER_PORT`)
- Health check: `GET /health`

## Scripts

From repository root:

```bash
pnpm dev            # run client + server in parallel
pnpm dev:client     # run frontend only
pnpm dev:server     # run backend only
pnpm build          # build client + server
pnpm lint           # lint and auto-fix
pnpm lint:check     # lint check without write
pnpm format         # format all files
```

Client-focused checks:

```bash
pnpm --filter client typecheck
pnpm --filter client lint
pnpm --filter client build
pnpm --filter server typecheck
pnpm --filter server lint
pnpm --filter server build
```

## Engineering Standards

- Keep strict typing; avoid `any` and unnecessary suppression comments.
- All user-facing text should go through i18n keys.
- Prefer small, composable modules and predictable naming.
- Follow Conventional Commits and repository linting rules.

## Roadmap

- Continue improving multi-database feature parity.
- Enhance shell compatibility and command feedback.
- Expand i18n coverage for all new modules by default.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening issues or pull requests.

## Security

Please report vulnerabilities to `x1_mailer@163.com`. See [SECURITY.md](SECURITY.md) for details.

## License

Released under the [MIT License](LICENSE).
