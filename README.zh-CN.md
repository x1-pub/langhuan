# LangHuan Hub

[简体中文](README.zh-CN.md) | [English](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node >= 22.12](https://img.shields.io/badge/Node-%3E%3D22.12-339933?logo=node.js&logoColor=white)
![pnpm workspace](https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white)

LangHuan Hub 是一个开源的 Web 数据库管理平台，重点关注可维护性、可扩展性和友好的协作体验。

## 核心特性

- 统一管理 MySQL、MariaDB、PostgreSQL、Redis、MongoDB。
- 提供接近原生体验的 Shell 页面，支持直接执行数据库命令。
- 支持表、文档、索引、键值等可视化操作。
- 基于 `packages/*` 共享类型与校验模型的 TypeScript Monorepo。
- 内置界面多语言：英文、简体中文、日语、韩语。

## 支持的数据库

- MySQL
- MariaDB
- PostgreSQL
- Redis
- MongoDB

## 技术栈

| 分层     | 技术                                             |
| -------- | ------------------------------------------------ |
| 前端     | React 19、Vite、Ant Design、TanStack Query、Less |
| 后端     | Fastify、tRPC、Drizzle ORM                       |
| 共享层   | TypeScript、Zod、pnpm workspace                  |
| 工程质量 | ESLint、Prettier、Husky、lint-staged             |

## 仓库结构

```text
langhuan/
├── client/            # React 前端应用
├── server/            # Fastify + tRPC 后端服务
├── packages/          # 共享 types/zod 模块
├── .github/           # GitHub 工作流与社区模板
├── .husky/            # Git hooks
├── CONTRIBUTING.md    # 贡献指南
├── SECURITY.md        # 安全策略
└── pnpm-workspace.yaml
```

## 快速开始

### 环境要求

- Node.js >= `22.12`
- pnpm >= `8`（推荐 `corepack enable`）
- 可用的数据库实例（按需启动）

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp server/.env.example server/.env
```

关键服务端环境变量：

- `DATABASE_URL`：用于存储连接信息的元数据库。
- `SERVER_HOST`：服务监听地址（默认 `0.0.0.0`）。
- `SERVER_PORT`：服务监听端口（默认 `7209`）。
- `CORS_ORIGINS`：CORS 白名单，多个来源以英文逗号分隔，本地开发可使用 `*`。

### 3. 执行数据库迁移

```bash
pnpm --filter server db:migrate
```

### 4. 启动开发环境

```bash
pnpm dev
```

默认地址：

- Client：`http://localhost:5173`（Vite 默认）
- Server：`http://localhost:7209`（或你配置的 `SERVER_PORT`）
- 健康检查：`GET /health`

## 常用脚本

在仓库根目录执行：

```bash
pnpm dev            # 同时启动 client + server
pnpm dev:client     # 仅启动前端
pnpm dev:server     # 仅启动后端
pnpm build          # 构建 client + server
pnpm lint           # 代码检查并自动修复
pnpm lint:check     # 仅检查，不写入修复
pnpm format         # 格式化全仓库
```

前端常用检查：

```bash
pnpm --filter client typecheck
pnpm --filter client lint
pnpm --filter client build
pnpm --filter server typecheck
pnpm --filter server lint
pnpm --filter server build
```

## 开发规范

- 保持严格类型，避免滥用 `any` 与无必要忽略注释。
- 所有面向用户的文案统一走 i18n key。
- 组件尽量小而清晰，命名与目录结构保持一致性。
- 提交遵循 Conventional Commits 与仓库规则。

## 路线图

- 持续提升多数据库功能的一致性。
- 增强 Shell 的兼容性与命令反馈体验。
- 默认为新增模块补齐多语言文案。

## 参与贡献

提交 Issue/PR 前请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 安全说明

发现安全问题请发送至 `x1_mailer@163.com`，详见 [SECURITY.md](SECURITY.md)。

## 许可证

本项目基于 [MIT License](LICENSE) 开源。
