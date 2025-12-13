## Langhuan

`琅嬛阁` 是源自上古神话中藏纳万卷天书的仙府，寓意无尽的知识宝藏。本平台以 `琅嬛` 为名，旨在提供一个可扩展、可维护、易贡献的网页端数据库管理工具。

`Langhuan Hub` originates from ancient Chinese mythology, referring to a celestial repository that houses countless volumes of divine texts, symbolizing an inexhaustible treasury of knowledge. Named `Langhuan`, this platform aims to provide a web-based database management tool that is extensible, maintainable, and easy to contribute to.

### 技术栈

- **前端**：React 19、Vite、Ant Design 5、TanStack Query、Less
- **后端**：Fastify、tRPC
- **通用**：TypeScript、Zod、pnpm Workspace、Husky、lint-staged、Prettier

### 仓库结构

```
langhuan-trpc
├── client/          # React 前端应用
├── server/          # Fastify + tRPC 服务端
├── packages/        # 共享的工具、类型与 schema
├── .husky/          # Git hooks（Conventional Commit 校验、lint-staged）
├── .github/         # Issue/PR 模板与 GitHub 相关配置
└── pnpm-workspace.yaml
```

### 先决条件

- [Node.js](https://nodejs.org/) >= 22.12
- [pnpm](https://pnpm.io/) >= 8 (`corepack enable` 可快速启用)
- 可用的数据库实例（MySQL / 其它后端所需资源）

### 快速开始

服务端依赖的数据库等环境变量可在 `server/.env.example` 中找到示例。

```bash
pnpm install

(cd server && pnpm db:migrate)

pnpm dev
```

### 代码质量

- 使用 **Prettier** 统一格式，配置见 `prettier.config.cjs`。
- 使用 **ESLint**（仓库根级 `eslint.config.mjs` 统一 client / server / packages）保证静态检查。
- Husky `pre-commit` 会执行 `lint-staged`（先跑 ESLint `--fix`，再跑 Prettier）以及完整 `pnpm lint`，`commit-msg` 会校验 Conventional Commits。

### 贡献指南

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 获取分支策略、代码规范和提交流程。

### 安全策略

若发现安全问题，请邮件至 `x1_mailer@163.com`，详情参见 [SECURITY.md](SECURITY.md)。

### 许可证

本项目采用 [MIT](LICENSE) 协议发布。
