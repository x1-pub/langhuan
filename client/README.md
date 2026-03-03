# LangHuan Hub Client

Frontend application for LangHuan Hub, built with React + TypeScript + Vite.

## Tech Stack

- React 19
- TypeScript (strict mode)
- Vite 7
- Ant Design 6
- TanStack Query + tRPC
- i18next (English + Simplified Chinese + Japanese + Korean)

## Quick Start

```bash
pnpm install
pnpm --filter client dev
```

App runs on the Vite default host/port unless overridden.

## Scripts

From repo root:

```bash
pnpm --filter client dev
pnpm --filter client typecheck
pnpm --filter client lint
pnpm --filter client lint:fix
pnpm --filter client format
pnpm --filter client format:check
pnpm --filter client build
pnpm --filter client preview
```

## Project Structure

```text
client/
  src/
    assets/          # images, SVGs
    components/      # reusable UI and layout modules
    hooks/           # shared React hooks
    i18n/            # locale dictionaries (en/zh/ja/ko)
    pages/           # route-level pages
    routes/          # router definitions
    styles/          # global styles
    utils/           # app utilities
```

## Open Source Quality Guidelines

- Keep TypeScript strict: avoid `any`, avoid suppression comments unless absolutely necessary.
- All user-facing text should use i18n keys from locale dictionaries.
- Avoid raw HTML injection. If needed, sanitize/escape content before render.
- Use `window.open(..., '_blank', 'noopener,noreferrer')` for external pages.
- Prefer small, composable components and colocated styles (`*.module.less`).

## i18n Notes

- Add keys in all supported language files when introducing new UI text.
- Keep key naming grouped by domain (e.g. `home.shell.status`).
- Do not leave hardcoded strings in components.

## Build & Release Check

Minimum pre-PR checks:

```bash
pnpm --filter client typecheck
pnpm --filter client lint
pnpm --filter client build
```
