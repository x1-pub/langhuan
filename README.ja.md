# LangHuan Hub

[简体中文](README.zh-CN.md) | [English](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node >= 22.12](https://img.shields.io/badge/Node-%3E%3D22.12-339933?logo=node.js&logoColor=white)
![pnpm workspace](https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white)

LangHuan Hub は、保守性・拡張性・コントリビューションしやすさを重視した、オープンソースの Web データベース管理プラットフォームです。

## 主な特徴

- MySQL、MariaDB、PostgreSQL、Redis、MongoDB を一元管理。
- ネイティブに近い操作感の Shell ページで直接コマンド実行。
- テーブル、ドキュメント、インデックス、キー値データの可視化操作。
- `packages/*` を通じた型・スキーマ共有の TypeScript モノレポ構成。
- UI 多言語対応: 英語・簡体字中国語・日本語・韓国語。

## 対応データベース

- MySQL
- MariaDB
- PostgreSQL
- Redis
- MongoDB

## 技術スタック

| レイヤー       | スタック                                         |
| -------------- | ------------------------------------------------ |
| フロントエンド | React 19, Vite, Ant Design, TanStack Query, Less |
| バックエンド   | Fastify, tRPC, Drizzle ORM                       |
| 共有基盤       | TypeScript, Zod, pnpm workspace                  |
| 開発品質       | ESLint, Prettier, Husky, lint-staged             |

## リポジトリ構成

```text
langhuan/
├── client/            # React フロントエンド
├── server/            # Fastify + tRPC バックエンド
├── packages/          # 共有 types/zod モジュール
├── .github/           # GitHub ワークフローとテンプレート
├── .husky/            # Git hooks
├── CONTRIBUTING.md    # コントリビューションガイド
├── SECURITY.md        # セキュリティポリシー
└── pnpm-workspace.yaml
```

## クイックスタート

### 前提条件

- Node.js >= `22.12`
- pnpm >= `8`（`corepack enable` 推奨）
- 接続対象のデータベースが起動済みであること

### 1. 依存関係をインストール

```bash
pnpm install
```

### 2. 環境変数を設定

```bash
cp server/.env.example server/.env
```

### 3. マイグレーションを実行

```bash
pnpm --filter server db:migrate
```

### 4. 開発サーバーを起動

```bash
pnpm dev
```

デフォルト URL:

- Client: `http://localhost:5173`（Vite デフォルト）
- Server: `http://localhost:7209`

## 主要スクリプト

リポジトリルートで実行:

```bash
pnpm dev            # client + server を同時起動
pnpm dev:client     # フロントエンドのみ起動
pnpm dev:server     # バックエンドのみ起動
pnpm build          # client + server をビルド
pnpm lint           # lint + 自動修正
pnpm format         # 全体フォーマット
```

フロントエンド検証:

```bash
pnpm --filter client typecheck
pnpm --filter client lint
pnpm --filter client build
```

## 開発ルール

- 厳格な型運用を維持し、`any` の乱用を避ける。
- ユーザー向け文言は i18n キーを利用する。
- 小さく再利用しやすいモジュール構成を優先する。
- Conventional Commits とリポジトリの lint ルールに従う。

## ロードマップ

- マルチデータベース機能の整合性をさらに向上。
- Shell の互換性と実行フィードバックを改善。
- 新規モジュールの i18n カバレッジを標準化。

## コントリビューション

Issue / PR の前に [CONTRIBUTING.md](CONTRIBUTING.md) を確認してください。

## セキュリティ

脆弱性報告は `x1_mailer@163.com` へ送信してください。詳細は [SECURITY.md](SECURITY.md)。

## ライセンス

本プロジェクトは [MIT License](LICENSE) で公開されています。
