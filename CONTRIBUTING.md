# コントリビューションガイド

Rimorプロジェクトへの貢献をご検討いただき、ありがとうございます。このガイドでは、プロジェクトへの貢献方法について説明します。

## 目次

- [開発環境のセットアップ](#開発環境のセットアップ)
- [開発フロー](#開発フロー)
- [CI/CDワークフロー](#cicdワークフロー)
- [コーディング規約](#コーディング規約)
- [テスト](#テスト)
- [プルリクエスト](#プルリクエスト)
- [リリースプロセス](#リリースプロセス)

## 開発環境のセットアップ

1. **リポジトリのフォーク**
   ```bash
   git clone https://github.com/[your-username]/rimor.git
   cd rimor
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   ```

3. **ビルド**
   ```bash
   npm run build
   ```

4. **テストの実行**
   ```bash
   npm test
   ```

## 開発フロー

### ブランチ戦略

- `main`: 安定版リリースブランチ
- `develop`: 開発ブランチ
- `feature/*`: 機能開発ブランチ
- `fix/*`: バグ修正ブランチ
- `refactor/*`: リファクタリングブランチ

### 開発サイクル

1. **issue の作成または選択**
   - 新機能やバグ修正の前に、issueを作成または既存のissueを選択

2. **ブランチの作成**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **開発とテスト**
   - テスト駆動開発（TDD）を実践
   - 変更に対するテストを必ず追加

4. **ローカルでの品質チェック**
   ```bash
   npm run build
   npm test
   npm run security-check
   node scripts/quality-audit.js
   ```

## CI/CDワークフロー

Rimor v0.8.0では、4段階のCIワークフローを採用しています：

### 1. Build and Verification（ビルドと検証）
- TypeScriptのコンパイル
- 型チェック
- 基本的な構文検証

### 2. Security Audit（セキュリティ監査）
- **npm audit**: 依存関係の脆弱性チェック
- **TaintTyper**: 型ベースセキュリティ解析
  - テストコードのセキュリティパターン検出
  - SQLインジェクション、XSSなどの脆弱性検出

### 3. Quality Audit（品質監査）
- **Dogfooding**: Rimor自身でRimorを解析
- 5次元品質評価:
  - カバレッジ（25%）
  - 複雑度（20%）
  - 保守性（20%）
  - セキュリティ（25%）
  - テスト品質（10%）
- 品質閾値:
  - 総合スコア: 70点以上
  - セキュリティスコア: 85点以上
  - カバレッジスコア: 60点以上

### 4. Test（テスト実行）
- 単体テスト・統合テストの実行
- AIエラーレポートの生成（失敗時）

### ローカルでのCI再現

```bash
# フルチェック（推奨）
npm run full-check

# 個別実行
npm run security-check        # セキュリティチェック
node scripts/quality-audit.js # 品質監査
npm test                      # テスト実行
```

### CI結果の確認

各ジョブの結果は`.rimor/reports/`配下に保存されます：
- `.rimor/reports/security/`: セキュリティ監査結果
- `.rimor/reports/quality/`: 品質監査結果
- `.rimor/reports/test-errors-ai.md`: AIエラーレポート

## コーディング規約

### TypeScript

- 厳格な型定義を使用
- `any`型の使用は避ける
- インターフェースと型エイリアスを適切に使い分ける

### コードスタイル

- ESLintルールに従う
- Prettierでフォーマット
- 関数は単一責任の原則に従う

### コミットメッセージ

```
<type>(<scope>): <subject>

<body>

<footer>
```

タイプ:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド、補助ツール

例:
```
feat(security): TaintTyper統合によるセキュリティ解析強化

- TypeBasedSecurityEngineを使用した静的解析
- ゼロランタイムオーバーヘッドの実現
- CI環境でのみ実行される設計
```

## テスト

### テストの種類

1. **単体テスト** (`test/`)
   - 各モジュールの独立したテスト
   - モックを活用した高速実行

2. **統合テスト** (`test/integration/`)
   - モジュール間の連携テスト
   - 実際のファイルシステムを使用

3. **性能テスト** (`test/performance/`)
   - 大規模プロジェクトでの動作確認
   - メモリ使用量とスループット測定

### テスト実行

```bash
# 全テスト
npm test

# 特定のテスト
npm test -- analyzer.test.ts

# ウォッチモード
npm run dev:test
```

### AIエラーレポート

テスト失敗時、以下のファイルが自動生成されます：
- `.rimor/reports/test-errors-ai.md`: AI向け最適化レポート
- `.rimor/reports/test-errors-ai.json`: 構造化データ

## プルリクエスト

### PRテンプレート

```markdown
## 概要
変更の概要を記載

## 変更内容
- [ ] 実装した機能/修正した内容

## テスト
- [ ] 単体テストを追加/更新
- [ ] 統合テストを実行
- [ ] ローカルでCI相当のチェックを実行

## チェックリスト
- [ ] コードはプロジェクトのスタイルガイドに従っている
- [ ] セルフレビューを実施した
- [ ] ドキュメントを更新した（必要な場合）
- [ ] 破壊的変更がない（ある場合は明記）
```

### レビュープロセス

1. CIが全て成功することを確認
2. 少なくとも1名のレビューアーの承認が必要
3. mainブランチへのマージは管理者が実施

## リリースプロセス

1. **リリース準備チェック**
   ```bash
   npm run pre-release-check
   ```

2. **健全性チェック**
   ```bash
   npm run health-check
   ```

3. **CHANGELOGの更新**
   - 全ての変更を記載
   - 破壊的変更を明記

4. **バージョンタグの作成**
   ```bash
   npm version [major|minor|patch]
   ```

## サポート

質問や提案がある場合：
- [Issue](https://github.com/sasakama-code/rimor/issues)を作成
- [Discussions](https://github.com/sasakama-code/rimor/discussions)で議論

## ライセンス

このプロジェクトに貢献することで、あなたのコントリビューションがMITライセンスの下でライセンスされることに同意したものとみなされます。