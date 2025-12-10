# Langhuan tRPC Monorepo

Langhuan 是一个基于 pnpm 的全栈 monorepo，包含 React 客户端与 Fastify + tRPC 服务端，并配套共享工具包。该仓库旨在提供一个可扩展、可维护、易贡献的网页端数据库管理和开发工具。

## 技术栈

- **前端**：React 19、Vite、Ant Design 5、TanStack Query、Less
- **后端**：Fastify、tRPC、Redis、Sequelize、Mongoose
- **通用**：TypeScript、Zod、pnpm Workspace、Husky、lint-staged、Prettier

## 仓库结构

```
langhuan-trpc
├── client/          # React 前端应用
├── server/          # Fastify + tRPC 服务端
├── packages/        # 共享的工具、类型与 schema
├── .husky/          # Git hooks（Conventional Commit 校验、lint-staged）
├── .github/         # Issue/PR 模板与 CI Workflow
└── pnpm-workspace.yaml
```

## 先决条件

- [Node.js](https://nodejs.org/) >= 22.12
- [pnpm](https://pnpm.io/) >= 8 (`corepack enable` 可快速启用)
- 可用的数据库实例（MySQL / 其它后端所需资源）

## 快速开始

```bash
pnpm install

pnpm dev
```

服务端依赖的环境变量可在 `server/.env.example` 中找到示例。

## 常用脚本

| 命令               | 说明                                                 |
| ------------------ | ---------------------------------------------------- |
| `pnpm dev`         | 并行启动 client 与 server                            |
| `pnpm build`       | 并行构建 client 与 server                            |
| `pnpm format`      | 使用 Prettier 格式化整个仓库                         |
| `pnpm lint`        | 并行运行 client/server 各自的 ESLint                 |
| `pnpm lint-staged` | 在 Git 提交前对改动文件执行 ESLint --fix 与 Prettier |

## 代码质量

- 使用 **Prettier** 统一格式，配置见 `prettier.config.cjs`。
- 使用 **ESLint**（仓库根级 `eslint.config.mjs` 统一 client / server / packages）保证静态检查。
- Husky `pre-commit` 会执行 `lint-staged`（先跑 ESLint `--fix`，再跑 Prettier）以及完整 `pnpm lint`，`commit-msg` 会校验 Conventional Commits。

## 环境变量

- `server/.env.example` 展示了数据库连接串、`DEV_USER_ID` 等必备字段。复制到 `.env.development` / `.env.production` 后再按需修改。
- 客户端默认无需 `.env` 文件，如需覆盖 Vite 变量可在本地创建 `.env.local`（不会加入版本控制）。

## 贡献指南

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 获取分支策略、代码规范和提交流程。

## 安全策略

若发现安全问题，请邮件至 `x1_mailer@163.com`，详情参见 [SECURITY.md](SECURITY.md)。

## 许可证

本项目采用 [MIT](LICENSE) 协议发布。
