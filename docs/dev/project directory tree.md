## Rimor プロジェクトディレクトリ構成

### Day 1-2: 最小限構成（開始時点）

```
rimor/
├── package.json
├── tsconfig.json
├── .gitignore
├── src/
│   ├── index.ts          # エントリーポイント（10行）
│   ├── core/
│   │   └── analyzer.ts   # コア分析エンジン（30行）
│   └── types/
│       └── index.ts      # 基本的な型定義（20行）
└── README.md             # 最小限の説明
```

### Day 3-4: 最初のプラグイン追加

```
rimor/
├── package.json
├── tsconfig.json
├── .gitignore
├── src/
│   ├── index.ts
│   ├── cli.ts            # 基本的なCLI（新規）
│   ├── core/
│   │   ├── analyzer.ts
│   │   └── file-finder.ts  # ファイル探索（新規）
│   ├── plugins/
│   │   └── test-existence.plugin.ts  # 最初のプラグイン！
│   └── types/
│       └── index.ts
├── examples/             # テスト用サンプル（新規）
│   └── sample-project/
│       ├── src/
│       │   └── math.js
│       └── __tests__/
│           └── math.test.js
└── README.md
```

### Day 5-7: CLI強化とビルド設定

```
rimor/
├── package.json
├── tsconfig.json
├── .gitignore
├── .npmignore           # npm公開用（新規）
├── bin/
│   └── rimor.js         # CLIエントリーポイント（新規）
├── src/
│   ├── index.ts
│   ├── cli.ts
│   ├── core/
│   │   ├── analyzer.ts
│   │   ├── file-finder.ts
│   │   └── reporter.ts    # 結果出力（新規）
│   ├── plugins/
│   │   ├── test-existence.plugin.ts
│   │   └── assertion-exists.plugin.ts  # 2個目のプラグイン
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       └── logger.ts      # コンソール出力（新規）
├── dist/                # ビルド出力（gitignore）
├── examples/
│   └── sample-project/
└── README.md
```

### Day 8-10: 設定ファイルとプラグイン管理

```
rimor/
├── package.json
├── tsconfig.json
├── jest.config.js       # テスト設定（新規）
├── .gitignore
├── .npmignore
├── .rimorrc.json        # デフォルト設定（新規）
├── bin/
│   └── rimor.js
├── src/
│   ├── index.ts
│   ├── cli.ts
│   ├── core/
│   │   ├── analyzer.ts
│   │   ├── file-finder.ts
│   │   ├── reporter.ts
│   │   ├── plugin-manager.ts  # プラグイン管理（新規）
│   │   └── config-loader.ts   # 設定読み込み（新規）
│   ├── plugins/
│   │   ├── test-existence.plugin.ts
│   │   ├── assertion-exists.plugin.ts
│   │   └── async-pattern.plugin.ts    # 3個目のプラグイン
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── logger.ts
│       └── file-utils.ts   # ファイル操作（新規）
├── tests/               # 基本的なテスト（新規）
│   ├── core/
│   │   └── analyzer.test.ts
│   └── plugins/
│       └── test-existence.test.ts
├── dist/
├── examples/
│   ├── sample-project/
│   └── typescript-project/  # TS用サンプル（新規）
├── docs/                # 最小限のドキュメント（新規）
│   └── plugin-development.md
└── README.md
```

### Day 11-14: MVP完成時点

```
rimor/
├── package.json
├── package-lock.json
├── tsconfig.json
├── jest.config.js
├── .gitignore
├── .npmignore
├── .github/             # GitHub設定（新規）
│   └── workflows/
│       └── test.yml     # 基本的なCI
├── .rimorrc.json
├── CHANGELOG.md         # リリースノート（新規）
├── LICENSE              # MITライセンス（新規）
├── bin/
│   └── rimor.js
├── src/
│   ├── index.ts
│   ├── cli.ts
│   ├── core/
│   │   ├── analyzer.ts
│   │   ├── file-finder.ts
│   │   ├── reporter.ts
│   │   ├── plugin-manager.ts
│   │   ├── config-loader.ts
│   │   └── score-calculator.ts  # スコア計算（新規）
│   ├── plugins/
│   │   ├── index.ts        # プラグイン一覧（新規）
│   │   ├── test-existence.plugin.ts
│   │   ├── assertion-exists.plugin.ts
│   │   ├── async-pattern.plugin.ts
│   │   └── base-plugin.ts  # 基底クラス（新規）
│   ├── formatters/        # 出力フォーマット（新規）
│   │   ├── console.formatter.ts
│   │   └── json.formatter.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── plugin.types.ts
│   │   └── config.types.ts
│   └── utils/
│       ├── logger.ts
│       ├── file-utils.ts
│       └── error-handler.ts  # 最小限のエラー処理（新規）
├── tests/
│   ├── core/
│   │   ├── analyzer.test.ts
│   │   └── file-finder.test.ts
│   ├── plugins/
│   │   └── test-existence.test.ts
│   └── fixtures/          # テスト用データ（新規）
│       └── sample-files/
├── dist/
├── examples/
│   ├── sample-project/
│   ├── typescript-project/
│   └── real-world-project/  # 実例（新規）
├── docs/
│   ├── getting-started.md   # クイックスタート（新規）
│   ├── plugin-development.md
│   └── api-reference.md     # 簡易APIドキュメント（新規）
├── scripts/              # 開発用スクリプト（新規）
│   ├── build.sh
│   └── release.sh
└── README.md
```

### 各ディレクトリの役割と成長

```yaml
src/core/:
  Day 1-2: analyzer.ts のみ（30行）
  Day 14: 6ファイル（各50-100行）
  役割: 中核となる解析エンジン

src/plugins/:
  Day 3: 最初のプラグイン（20行）
  Day 14: 4プラグイン + 基底クラス
  役割: 拡張可能な品質チェック

src/types/:
  Day 1: 基本的な型のみ
  Day 14: 用途別に分割
  役割: TypeScriptの型安全性

tests/:
  Day 8: 最初のテスト作成
  Day 14: 主要機能のテスト
  役割: 最小限の品質保証

examples/:
  Day 3: 動作確認用
  Day 14: 実例3種類
  役割: ドッグフーディングとデモ
```

### package.json の進化

```json
// Day 1-2
{
  "name": "rimor",
  "version": "0.0.1",
  "scripts": {
    "build": "tsc",
    "start": "ts-node src/index.ts"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^18.0.0",
    "ts-node": "^10.0.0"
  }
}

// Day 14 (MVP完成時)
{
  "name": "rimor",
  "version": "0.1.0",
  "description": "Discover What Your Tests Are Missing",
  "bin": {
    "rimor": "./bin/rimor.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/",
    "prepublishOnly": "npm run build",
    "dev": "ts-node src/cli.ts",
    "rimor": "node dist/cli.js"
  },
  "dependencies": {
    "chalk": "^5.0.0",
    "yargs": "^17.0.0",
    "glob": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^18.0.0",
    "@types/jest": "^29.0.0",
    "@types/yargs": "^17.0.0",
    "ts-node": "^10.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0"
  },
  "files": [
    "dist/",
    "bin/"
  ],
  "keywords": ["test", "quality", "audit", "static-analysis"],
  "license": "MIT"
}
```

### tsconfig.json（シンプルで実用的）

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### .gitignore（実用的な内容）

```
# Dependencies
node_modules/

# Build
dist/
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test coverage
coverage/
.nyc_output/

# Temporary
tmp/
temp/

# Local config
.rimorrc.local.json
```

### 技術的負債の記録場所

```
rimor/
├── TECHNICAL_DEBT.md    # Week 2から追加
└── docs/
    └── decisions/       # Month 2から追加
        ├── 001-minimal-plugin-api.md
        └── 002-no-config-validation.md
```

この構成により：
1. **Day 1から動くものが作れる**
2. **段階的に機能を追加できる**
3. **ディレクトリが散らからない**
4. **将来の拡張が容易**
5. **npm公開の準備も完了**

最も重要なのは、最初は`src/`以下の数ファイルだけに集中し、必要に応じて追加していくことです。