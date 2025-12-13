## 贡献指南

感谢你对 Langhuan 的兴趣！请遵循以下流程提交改动：

### 开发流程

1. Fork 仓库并创建特性分支：`git checkout -b feature/awesome-feature`
2. 安装依赖：`pnpm install`
3. 在文件 `server/.env` 配置数据库环境变量后同步数据库表结构: `(cd server && pnpm db:migrate)`
4. 一键启动 `pnpm dev` 或按需启动 `pnpm dev:client` / `pnpm dev:server` 进行开发
5. 提交改动文件
6. 提交 PR 前同步最新的 `main` 分支，解决冲突

### 提交规范

- 使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/)（仓库已通过 Husky 自动校验）
- 每个 PR 需聚焦单一主题，并填写 PR 模板中的检查项
- 如包含界面改动，请附带截图或录屏

### 代码风格

- 统一使用 TypeScript
- 公共类型/工具优先放在 `packages/`
- 严禁将机密凭据提交进仓库，使用 `.env` 文件并列入 `.gitignore`

### 测试与验证

- 目前仓库未启用自动化测试，如引入测试请确保命令可在 CI 中运行
- 对于数据库相关改动，请在 PR 描述中说明所需的迁移步骤

### 文档

- 更新 README / 相关模块文档，确保使用说明与示例同步
- 若新增环境变量，请更新 `server/.env.example` 并在 PR 描述中说明用途

### 沟通

- 通过 Issue 讨论新功能，PR 请引用对应 Issue
- 紧急安全问题请勿公开 Issue，详见 [SECURITY.md](SECURITY.md)

感谢你的贡献！
