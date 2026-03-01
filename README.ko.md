# LangHuan Hub

[简体中文](README.zh-CN.md) | [English](README.md) | [日本語](README.ja.md) | [한국어](README.ko.md)

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node >= 22.12](https://img.shields.io/badge/Node-%3E%3D22.12-339933?logo=node.js&logoColor=white)
![pnpm workspace](https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm&logoColor=white)

LangHuan Hub는 유지보수성, 확장성, 기여 친화적인 개발 흐름을 목표로 하는 오픈소스 Web 데이터베이스 관리 플랫폼입니다.

## 주요 특징

- MySQL, MariaDB, PostgreSQL, Redis, MongoDB를 하나의 워크스페이스에서 관리.
- 네이티브에 가까운 Shell 페이지에서 데이터베이스 명령 직접 실행.
- 테이블, 문서, 인덱스, 키-값 데이터의 시각화 작업 지원.
- `packages/*` 기반의 타입/스키마 공유 TypeScript 모노레포.
- UI 다국어 지원: 영어, 중국어(간체), 일본어, 한국어.

## 지원 데이터베이스

- MySQL
- MariaDB
- PostgreSQL
- Redis
- MongoDB

## 기술 스택

| 레이어     | 스택                                             |
| ---------- | ------------------------------------------------ |
| 프론트엔드 | React 19, Vite, Ant Design, TanStack Query, Less |
| 백엔드     | Fastify, tRPC, Drizzle ORM                       |
| 공통       | TypeScript, Zod, pnpm workspace                  |
| 품질 도구  | ESLint, Prettier, Husky, lint-staged             |

## 저장소 구조

```text
langhuan/
├── client/            # React 프론트엔드
├── server/            # Fastify + tRPC 백엔드
├── packages/          # 공용 types/zod 모듈
├── .github/           # GitHub 워크플로/커뮤니티 템플릿
├── .husky/            # Git hooks
├── CONTRIBUTING.md    # 기여 가이드
├── SECURITY.md        # 보안 정책
└── pnpm-workspace.yaml
```

## 빠른 시작

### 사전 요구사항

- Node.js >= `22.12`
- pnpm >= `8` (`corepack enable` 권장)
- 연결할 데이터베이스 인스턴스 실행 상태

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

```bash
cp server/.env.example server/.env
```

### 3. 마이그레이션 실행

```bash
pnpm --filter server db:migrate
```

### 4. 개발 서버 실행

```bash
pnpm dev
```

기본 주소:

- Client: `http://localhost:5173` (Vite 기본)
- Server: `http://localhost:7209`

## 주요 스크립트

저장소 루트에서 실행:

```bash
pnpm dev            # client + server 동시 실행
pnpm dev:client     # 프론트엔드만 실행
pnpm dev:server     # 백엔드만 실행
pnpm build          # client + server 빌드
pnpm lint           # 린트 + 자동 수정
pnpm format         # 전체 포맷팅
```

프론트엔드 검증:

```bash
pnpm --filter client typecheck
pnpm --filter client lint
pnpm --filter client build
```

## 개발 기준

- 엄격한 타입 안정성을 유지하고 `any` 남용을 피합니다.
- 사용자 노출 문구는 i18n 키를 통해 관리합니다.
- 작고 조합 가능한 모듈 설계를 우선합니다.
- Conventional Commits 및 저장소 lint 규칙을 준수합니다.

## 로드맵

- 멀티 데이터베이스 기능 일관성 지속 개선.
- Shell 호환성과 실행 피드백 고도화.
- 신규 모듈의 i18n 적용 범위 기본 확장.

## 기여

이슈/PR 작성 전 [CONTRIBUTING.md](CONTRIBUTING.md)를 먼저 확인해 주세요.

## 보안

보안 취약점은 `x1_mailer@163.com`으로 제보해 주세요. 자세한 내용은 [SECURITY.md](SECURITY.md)를 참고하세요.

## 라이선스

본 프로젝트는 [MIT License](LICENSE)로 배포됩니다.
