import { getPersistedLanguage } from '@/utils/storage';

type HomeLanguage = 'en' | 'zh' | 'ja' | 'ko';

interface HomeCopy {
  siteName: string;
  home: {
    start: string;
    question: string;
    text1: string;
    text2: string;
    text3: string;
    d2: string;
    story1: string;
    story2: string;
    support: string;
    ready: string;
    startNow: string;
    freeNow: string;
    github: string;
    meta: {
      license: string;
      engines: string;
      availability: string;
    };
    shell: {
      title: string;
      tabWorkspace: string;
      tabAgent: string;
      tabDeploy: string;
      hint: string;
      assistant: string;
      you: string;
      message1: string;
      message2: string;
      status: string;
    };
    engines: {
      mysqlDesc: string;
      mysqlTag1: string;
      mysqlTag2: string;
      mariadbDesc: string;
      mariadbTag1: string;
      mariadbTag2: string;
      redisDesc: string;
      redisTag1: string;
      redisTag2: string;
      mongoDesc: string;
      mongoTag1: string;
      mongoTag2: string;
      pgsqlDesc: string;
      pgsqlTag1: string;
      pgsqlTag2: string;
    };
  };
}

const HOME_COPY: Record<HomeLanguage, HomeCopy> = {
  en: {
    siteName: 'LangHuan Hub',
    home: {
      start: 'Get Started',
      question: 'Suggestions are welcome',
      text1: 'POWERFUL',
      text2: 'DATABASE GUI',
      text3: 'Easily manage your MySQL, MariaDB, Redis, MongoDB and PostgreSQL databases',
      d2: 'Mainstream engines in one unified workspace',
      story1:
        '"Langhuan" originates from ancient myths, referring to a celestial abode that houses thousands of volumes of precious books, symbolizing an endless treasure trove of knowledge.',
      story2:
        'With visualization workflows, we make data readable, explorable and operational for daily engineering work.',
      support: 'Support mainstream databases',
      ready: 'Ready to experience a more powerful database GUI?',
      startNow: 'Start now and make database operations simple and efficient',
      freeNow: 'Get started for free',
      github: 'GitHub',
      meta: {
        license: 'Open Source License',
        engines: 'Database Engines',
        availability: 'Anytime Access',
      },
      shell: {
        title: 'Database Workflow Preview',
        tabWorkspace: 'Query Workspace',
        tabAgent: 'Smart Suggestions',
        tabDeploy: 'Execution Log',
        hint: 'A full flow from data connection to diagnosis and optimization suggestions.',
        assistant: 'Assistant',
        you: 'You',
        message1: 'Detected high-latency query path. Recommended index: users(created_at DESC).',
        message2: 'Preview the migration, verify impact, and then merge.',
        status: 'Flow status: Connected · 3 suggestions ready',
      },
      engines: {
        mysqlDesc: 'Relational queries, table design and schema operations.',
        mysqlTag1: 'SQL',
        mysqlTag2: 'Schema',
        mariadbDesc: 'An open-source relational engine with strong MySQL compatibility.',
        mariadbTag1: 'Compatibility',
        mariadbTag2: 'Open Source',
        redisDesc: 'Key-level inspection and fast in-memory data workflows.',
        redisTag1: 'Keyspace',
        redisTag2: 'TTL',
        mongoDesc: 'Document browsing, aggregation and index management.',
        mongoTag1: 'Documents',
        mongoTag2: 'Pipeline',
        pgsqlDesc: 'Powerful SQL analysis for complex production datasets.',
        pgsqlTag1: 'Analytics',
        pgsqlTag2: 'Indexes',
      },
    },
  },
  zh: {
    siteName: '琅嬛阁',
    home: {
      start: '开始使用',
      question: '欢迎提出你的想法和建议',
      text1: '非常强大的',
      text2: 'WEB数据库管理平台',
      text3: '轻松管理您的 MySQL、MariaDB、Redis、MongoDB 和 PostgreSQL 数据库',
      d2: '在统一工作台中管理主流数据库引擎',
      story1:
        '"琅嬛"源自上古神话中藏纳万卷天书的仙府，寓意无尽的知识宝藏。本平台以"琅嬛阁"为名，致力于打造现代数据世界的智慧中枢。',
      story2: '通过可视化流程，让数据更可读、更可查，也更容易在团队中协作与沉淀。',
      support: '支持主流数据库',
      ready: '准备好体验更强大的数据库管理了吗？',
      startNow: '立即开始，让数据库管理变得简单高效',
      freeNow: '免费开始使用',
      github: 'GitHub',
      meta: {
        license: '开源许可',
        engines: '数据库引擎',
        availability: '随时可用',
      },
      shell: {
        title: '数据库智能工作流预览',
        tabWorkspace: '查询工作区',
        tabAgent: '智能建议',
        tabDeploy: '执行记录',
        hint: '从连接数据库到定位问题，再到生成优化建议的完整流程示例。',
        assistant: '系统建议',
        you: '你',
        message1: '检测到高延迟查询路径，建议索引：users(created_at DESC)。',
        message2: '先预览迁移并验证影响，再执行合并。',
        status: '流程状态：已连接数据库 · 已生成 3 条建议',
      },
      engines: {
        mysqlDesc: '关系型查询、表结构设计与 Schema 管理。',
        mysqlTag1: 'SQL',
        mysqlTag2: 'Schema',
        mariadbDesc: '兼容 MySQL 的高性能开源关系型数据库引擎。',
        mariadbTag1: '兼容性',
        mariadbTag2: '开源',
        redisDesc: '键空间检查与高性能内存数据操作。',
        redisTag1: 'Keyspace',
        redisTag2: 'TTL',
        mongoDesc: '文档浏览、聚合分析与索引维护。',
        mongoTag1: 'Documents',
        mongoTag2: 'Pipeline',
        pgsqlDesc: '面向复杂业务数据的高级 SQL 分析能力。',
        pgsqlTag1: 'Analytics',
        pgsqlTag2: 'Indexes',
      },
    },
  },
  ja: {
    siteName: '琅嬛阁',
    home: {
      start: 'はじめる',
      question: 'ご意見・ご提案を歓迎します',
      text1: '強力な',
      text2: 'WEBデータベース管理プラットフォーム',
      text3: 'MySQL、MariaDB、Redis、MongoDB、PostgreSQL を簡単に管理',
      d2: '主要データベースを 1 つのワークスペースで統合管理',
      story1:
        '「琅嬛」は古代神話に由来し、万巻の書を収めた知の宝庫を意味します。LangHuan Hub は現代データ運用のための知的ハブを目指しています。',
      story2:
        '可視化ワークフローにより、データを読みやすく、探しやすく、チームで扱いやすくします。',
      support: '主要データベースをサポート',
      ready: 'より強力なデータベース管理を体験しませんか？',
      startNow: '今すぐ始めて、運用をよりシンプルかつ高速に',
      freeNow: '無料で始める',
      github: 'GitHub',
      meta: {
        license: 'オープンソース',
        engines: '対応エンジン',
        availability: 'いつでも利用可能',
      },
      shell: {
        title: 'データベースワークフローのプレビュー',
        tabWorkspace: 'クエリワークスペース',
        tabAgent: 'スマート提案',
        tabDeploy: '実行ログ',
        hint: '接続から課題検出、最適化提案までの一連の流れを表示します。',
        assistant: 'システム提案',
        you: 'あなた',
        message1: '高遅延クエリを検出しました。推奨インデックス: users(created_at DESC)。',
        message2: 'まず移行内容をプレビューして影響を確認し、その後マージします。',
        status: '状態: 接続済み · 提案 3 件を生成',
      },
      engines: {
        mysqlDesc: 'リレーションクエリ、テーブル設計、スキーマ運用。',
        mysqlTag1: 'SQL',
        mysqlTag2: 'Schema',
        mariadbDesc: 'MySQL 互換性の高いオープンソース RDB エンジン。',
        mariadbTag1: '互換性',
        mariadbTag2: 'オープンソース',
        redisDesc: 'キー単位の確認と高速なインメモリ操作。',
        redisTag1: 'Keyspace',
        redisTag2: 'TTL',
        mongoDesc: 'ドキュメント閲覧、集計分析、インデックス管理。',
        mongoTag1: 'Documents',
        mongoTag2: 'Pipeline',
        pgsqlDesc: '複雑な業務データ向けの高度な SQL 分析。',
        pgsqlTag1: 'Analytics',
        pgsqlTag2: 'Indexes',
      },
    },
  },
  ko: {
    siteName: '琅嬛阁',
    home: {
      start: '시작하기',
      question: '의견과 제안을 환영합니다',
      text1: '강력한',
      text2: 'WEB 데이터베이스 관리 플랫폼',
      text3: 'MySQL, MariaDB, Redis, MongoDB, PostgreSQL을 쉽게 관리',
      d2: '주요 데이터베이스 엔진을 하나의 워크스페이스에서 관리',
      story1:
        '"Langhuan"은 고대 신화 속 지식의 보고를 뜻합니다. LangHuan Hub는 현대 데이터 운영을 위한 지능형 허브를 지향합니다.',
      story2: '시각화 워크플로를 통해 데이터를 더 쉽게 읽고, 찾고, 협업할 수 있습니다.',
      support: '주요 데이터베이스 지원',
      ready: '더 강력한 데이터베이스 관리를 경험할 준비가 되었나요?',
      startNow: '지금 시작하여 운영을 더 간단하고 효율적으로',
      freeNow: '무료로 시작하기',
      github: 'GitHub',
      meta: {
        license: '오픈소스 라이선스',
        engines: '데이터베이스 엔진',
        availability: '언제든 사용 가능',
      },
      shell: {
        title: '데이터베이스 워크플로 미리보기',
        tabWorkspace: '쿼리 워크스페이스',
        tabAgent: '스마트 제안',
        tabDeploy: '실행 로그',
        hint: '연결, 문제 진단, 최적화 제안까지 전체 흐름을 보여줍니다.',
        assistant: '시스템 제안',
        you: '사용자',
        message1: '지연이 높은 쿼리를 감지했습니다. 권장 인덱스: users(created_at DESC).',
        message2: '먼저 마이그레이션을 미리보기로 확인한 뒤 병합하세요.',
        status: '상태: 연결됨 · 제안 3개 생성',
      },
      engines: {
        mysqlDesc: '관계형 쿼리, 테이블 설계, 스키마 관리.',
        mysqlTag1: 'SQL',
        mysqlTag2: 'Schema',
        mariadbDesc: 'MySQL 호환성이 높은 오픈소스 관계형 엔진.',
        mariadbTag1: '호환성',
        mariadbTag2: '오픈소스',
        redisDesc: '키 단위 조회와 고성능 인메모리 데이터 처리.',
        redisTag1: 'Keyspace',
        redisTag2: 'TTL',
        mongoDesc: '문서 조회, 집계 분석, 인덱스 관리.',
        mongoTag1: 'Documents',
        mongoTag2: 'Pipeline',
        pgsqlDesc: '복잡한 비즈니스 데이터용 고급 SQL 분석.',
        pgsqlTag1: 'Analytics',
        pgsqlTag2: 'Indexes',
      },
    },
  },
};

const normalizeHomeLanguage = (value?: unknown): HomeLanguage | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const code = value.trim().toLowerCase().replace(/_/g, '-');
  if (code.startsWith('zh')) {
    return 'zh';
  }
  if (code.startsWith('ja')) {
    return 'ja';
  }
  if (code.startsWith('ko')) {
    return 'ko';
  }
  if (code.startsWith('en')) {
    return 'en';
  }
  return undefined;
};

const detectBrowserLanguage = (): HomeLanguage | undefined => {
  if (typeof navigator === 'undefined') {
    return undefined;
  }

  const candidates = Array.isArray(navigator.languages)
    ? navigator.languages
    : [navigator.language];
  for (const candidate of candidates) {
    const normalized = normalizeHomeLanguage(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
};

const detectHomeLanguage = (): HomeLanguage => {
  const storageLanguage = normalizeHomeLanguage(getPersistedLanguage());
  if (storageLanguage) {
    return storageLanguage;
  }

  return detectBrowserLanguage() || 'en';
};

export const getHomeCopy = (): HomeCopy => HOME_COPY[detectHomeLanguage()] || HOME_COPY.en;
