# Rimor セキュリティガイドライン v0.4.1

**バージョン**: 0.4.1  
**対象読者**: 開発者、システム管理者、セキュリティ担当者  
**最終更新**: 2025年7月24日

## 概要

このガイドラインは、Rimorテスト品質監査ツールを安全に使用・運用するためのセキュリティベストプラクティスを提供します。Rimor v0.4.1では大幅なセキュリティ強化が行われましたが、適切な設定と運用により、さらなるセキュリティ向上が可能です。

---

## **1. プラグインセキュリティ**

### **1.1 プラグインの安全な利用**

#### **信頼できるソースからの使用**
- **公式プラグインのみ使用**: Rimorプロジェクトが提供する公式プラグインを優先的に使用
- **サードパーティプラグインの検証**: 外部プラグインは事前にソースコード検証を実施
- **プラグイン署名の確認**: 署名済みプラグインの検証機能を活用

#### **プラグインサンドボックス設定**
```json
// .rimorrc.json でのサンドボックス設定例
{
  "security": {
    "pluginSandbox": {
      "enabled": true,
      "maxExecutionTime": 30000,  // 30秒
      "maxMemoryUsage": 16,       // 16MB
      "maxFileSize": 1048576,     // 1MB
      "allowedModules": [],       // 必要最小限のモジュールのみ許可
      "forbiddenGlobals": ["process", "global", "__dirname"]
    }
  }
}
```

#### **プラグイン開発時のセキュリティ**
- **外部プロセス実行の禁止**: `child_process`, `exec`, `spawn` の使用は避ける
- **ファイルシステムアクセスの制限**: 分析対象ファイル以外のアクセスは行わない
- **グローバル変数の操作禁止**: `global`, `process`, `require` の直接操作は避ける
- **プロトタイプ汚染の回避**: `Object.prototype` や `Array.prototype` の変更は禁止

### **1.2 プラグイン実行環境の監視**

#### **リソース使用量監視**
```bash
# プラグイン実行統計の確認
rimor analyze --verbose --show-performance-report

# サンドボックス統計の表示  
rimor analyze --show-sandbox-stats
```

#### **異常検出時の対応**
- **実行時間超過**: プラグインの効率性を見直し、必要に応じて制限時間を調整
- **メモリ使用量超過**: メモリリークの可能性を検証、プラグインの最適化を実施
- **セキュリティ違反**: 該当プラグインの無効化、ソースコードの再検証

---

## **2. 設定ファイルセキュリティ**

### **2.1 設定ファイルの安全な管理**

#### **ファイル権限設定**
```bash
# 設定ファイルの適切な権限設定
chmod 644 .rimorrc.json          # 読み取り専用
chmod 600 .rimorrc.local.json    # 機密情報含む場合

# ディレクトリの権限設定
chmod 755 ~/.rimor/              # ユーザー設定ディレクトリ
```

#### **設定ファイルの配置**
- **プロジェクトルート**: `.rimorrc.json` - チーム共有設定
- **ユーザーホーム**: `~/.rimor/config.json` - 個人設定
- **環境固有**: `.rimorrc.production.json` - 本番環境専用設定

#### **危険な設定の回避**
```json
// ❌ 危険な設定例（使用禁止）
{
  "plugins": {
    "malicious-plugin": {
      "enabled": true,
      "command": "eval('malicious_code')",
      "require": "../../../etc/passwd"
    }
  }
}

// ✅ 安全な設定例（推奨）
{
  "plugins": {
    "test-existence": {
      "enabled": true,
      "excludeFiles": ["index.ts", "types.ts"]
    }
  },
  "excludePatterns": [
    "node_modules/**",
    "dist/**",
    "coverage/**"
  ]
}
```

### **2.2 設定ファイルの検証**

#### **設定検証コマンド**
```bash
# 設定ファイルの検証
rimor config validate

# 設定ファイルのセキュリティ検査
rimor config security-check

# 設定ファイルの構文確認
rimor config lint
```

#### **自動検証の設定**
```json
{
  "security": {
    "configValidation": {
      "enabled": true,
      "maxFileSize": 524288,        // 512KB
      "maxObjectDepth": 5,          // 5層まで
      "maxProperties": 100,         // 100プロパティまで
      "forbiddenPatterns": [
        "eval\\(",
        "require\\(",
        "child_process",
        "__proto__",
        "constructor\\.prototype"
      ]
    }
  }
}
```

---

## **3. CLI利用時のセキュリティ**

### **3.1 CLI引数の安全な使用**

#### **パス指定のベストプラクティス**
```bash
# ✅ 安全なパス指定
rimor analyze ./src                 # 相対パス（推奨）
rimor analyze /project/src          # プロジェクト内の絶対パス

# ❌ 危険なパス指定（避ける）
rimor analyze ../../../etc         # パストラバーサル
rimor analyze /etc/passwd           # システムファイル
rimor analyze "$(malicious_cmd)"    # コマンドインジェクション
```

#### **出力ファイルの安全な指定**
```bash
# ✅ 安全な出力指定
rimor analyze --output ./report.json         # プロジェクト内
rimor analyze --output ~/reports/analysis.html

# ❌ 危険な出力指定（避ける）  
rimor analyze --output /etc/cron.daily/script  # システムディレクトリ
rimor analyze --output malicious.exe           # 実行可能ファイル
```

#### **環境変数の適切な設定**
```bash
# 安全な環境変数設定
export RIMOR_LANG=ja
export NODE_ENV=production

# セキュリティリスクのある環境変数（使用注意）
# export LD_PRELOAD=/path/to/lib.so        # ライブラリ事前読み込み
# export NODE_OPTIONS=--require=malicious  # Node.js起動オプション
```

### **3.2 CLI引数検証の設定**

#### **セキュリティ制限のカスタマイズ**
```typescript
// CLI セキュリティ制限の設定例
const customCLILimits = {
  maxPathLength: 500,                    // パス長制限
  maxOutputFileSize: 50 * 1024 * 1024,   // 出力ファイルサイズ制限
  allowedOutputExtensions: ['.json', '.txt', '.csv'],  // 許可拡張子
  forbiddenDirectoryPatterns: [
    '/etc/',
    '/root/',
    '/usr/bin/',
    'C:\\Windows\\'
  ],
  validateEnvironmentVariables: true     // 環境変数検証の有効化
};
```

---

## **4. 本番環境での運用**

### **4.1 本番環境セキュリティ設定**

#### **推奨設定**
```json
{
  "environment": "production",
  "security": {
    "pluginSandbox": {
      "enabled": true,
      "strictMode": true,
      "maxExecutionTime": 15000,    // 本番では短時間制限
      "maxMemoryUsage": 8,          // 本番では低メモリ制限
      "allowedModules": []          // 外部モジュール使用禁止
    },
    "configValidation": {
      "enabled": true,
      "strictValidation": true
    },
    "logging": {
      "securityEvents": true,       // セキュリティイベントログ
      "auditTrail": true           // 操作ログ記録
    }
  },
  "output": {
    "verbose": false,               // 本番では詳細出力無効
    "includeSystemInfo": false     // システム情報の出力無効
  }
}
```

#### **アクセス制御**
```bash
# 実行ユーザーの制限
sudo useradd -r -s /bin/false rimor-service
sudo -u rimor-service rimor analyze

# ファイル権限の厳格化
chmod 755 /usr/local/bin/rimor
chmod 644 /etc/rimor/config.json
chown root:root /usr/local/bin/rimor
```

### **4.2 監視とログ**

#### **セキュリティ監視項目**
- **プラグイン実行失敗率**: 異常なプラグイン動作の検出
- **設定ファイル検証エラー**: 悪意ある設定の試行検出
- **CLI引数検証失敗**: 攻撃的な引数指定の検出
- **リソース使用量異常**: DoS攻撃や異常なプラグイン動作の検出

#### **ログ設定例**
```json
{
  "logging": {
    "level": "warn",
    "securityLevel": "info",
    "destinations": [
      {
        "type": "file",
        "path": "/var/log/rimor/security.log",
        "format": "json"
      },
      {
        "type": "syslog",
        "facility": "security"
      }
    ],
    "events": [
      "plugin_security_violation",
      "config_validation_failure", 
      "cli_argument_rejection",
      "resource_limit_exceeded"
    ]
  }
}
```

---

## **5. セキュリティインシデント対応**

### **5.1 インシデント分類**

#### **Critical（緊急）**
- 任意コード実行の検出
- システムファイルへの不正アクセス
- 機密情報の漏洩

#### **High（高）**
- プラグインサンドボックスの回避試行
- 設定ファイル改ざんの検出
- 権限昇格の試行

#### **Medium（中）**
- リソース制限の超過
- 異常な引数指定の検出
- 設定検証エラーの頻発

### **5.2 対応手順**

#### **即座の対応**
1. **影響範囲の特定**: ログ分析による攻撃範囲の確認
2. **サービス停止**: 必要に応じてRimor実行の一時停止
3. **証拠保全**: ログファイルとシステム状態の保存
4. **初期封じ込め**: 攻撃元の特定とアクセス遮断

#### **調査と復旧**
1. **詳細調査**: セキュリティ専門家による深度調査
2. **脆弱性修正**: 必要に応じてRimorアップデート
3. **設定見直し**: セキュリティ設定の強化
4. **監視強化**: 検出機能の追加・強化

---

## **6. 開発時のセキュリティ**

### **6.1 セキュアコーディング**

#### **プラグイン開発**
```typescript
// ✅ 安全なプラグイン実装例
export class SecurePlugin implements IPlugin {
  name = 'secure-plugin';

  async analyze(filePath: string): Promise<Issue[]> {
    try {
      // ファイルパスの検証
      if (!this.isValidPath(filePath)) {
        return [];
      }
      
      // 安全なファイル読み込み
      const content = await this.safeReadFile(filePath);
      
      // 分析処理（外部実行なし）
      return this.performAnalysis(content);
      
    } catch (error) {
      // エラーの安全な処理
      return [{
        type: 'analysis-error',
        severity: 'warning',
        message: 'Analysis failed safely',
        file: filePath
      }];
    }
  }

  private isValidPath(filePath: string): boolean {
    // パス検証ロジック
    return !filePath.includes('..') && 
           !filePath.startsWith('/etc/') &&
           path.extname(filePath).match(/\.(js|ts|jsx|tsx)$/);
  }

  private async safeReadFile(filePath: string): Promise<string> {
    // PathSecurityを使用した安全なファイル読み込み
    return PathSecurity.safeReadFile(filePath);
  }
}
```

#### **設定処理**
```typescript
// 設定値の安全な処理例
function processConfig(config: any): SafeConfig {
  // 危険なキーの除去
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  const safeConfig = JSON.parse(JSON.stringify(config, (key, value) => {
    if (dangerousKeys.includes(key)) {
      return undefined;
    }
    return value;
  }));
  
  // 値の検証とサニタイゼーション
  return sanitizeConfigValues(safeConfig);
}
```

### **6.2 テスト時のセキュリティ**

#### **セキュリティテストの実行**
```bash
# セキュリティテストスイートの実行
npm run test:security

# 特定のセキュリティテスト
npm test -- test/security/PluginSandbox.test.ts
npm test -- test/security/ConfigSecurity.test.ts
npm test -- test/security/CLISecurity.test.ts

# カバレッジ付きセキュリティテスト
npm run test:security:coverage
```

#### **脆弱性スキャン**
```bash
# 依存関係の脆弱性スキャン
npm audit

# 静的解析によるセキュリティチェック
npm run lint:security

# 設定ファイルのセキュリティ検証
npm run config:security-check
```

---

## **7. 更新とメンテナンス**

### **7.1 セキュリティアップデート**

#### **定期更新スケジュール**
- **Critical修正**: 即座に適用（24時間以内）
- **High修正**: 1週間以内に適用
- **Medium修正**: 1ヶ月以内に適用
- **Low修正**: 四半期更新で適用

#### **更新前の検証**
```bash
# テスト環境での更新検証
rimor --version
npm run test:all
npm run test:security

# 本番適用前の最終確認
rimor config validate
rimor analyze --dry-run
```

### **7.2 セキュリティ設定の定期見直し**

#### **四半期レビュー項目**
- [ ] プラグインサンドボックス設定の妥当性
- [ ] 設定ファイル検証ルールの有効性
- [ ] CLI引数制限の適切性
- [ ] ログ監視設定の最適化
- [ ] アクセス制御の妥当性

#### **年次レビュー項目**
- [ ] セキュリティガイドラインの全面見直し
- [ ] 脅威モデルの更新
- [ ] インシデント対応手順の検証
- [ ] セキュリティ教育の実施

---

## **8. 参考資料**

### **8.1 関連ドキュメント**
- [セキュリティ脆弱性分析レポート v0.4.1](./dev/SECURITY_VULNERABILITY_ANALYSIS_v0.4.1.md)
- [Rimor プロジェクトレポート](./dev/Rimor%20Project%20Report.md)
- [要件定義書](./dev/old/Requirements%20definition%20document.md)

### **8.2 外部リソース**
- [OWASP セキュアコーディング実践](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Node.js セキュリティベストプラクティス](https://nodejs.org/en/security/)
- [TypeScript セキュリティガイド](https://cheatsheetseries.owasp.org/cheatsheets/TypeScript_Cheat_Sheet.html)

### **8.3 緊急連絡先**
- **セキュリティインシデント報告**: security@rimor-project.org
- **脆弱性報告**: vulnerability@rimor-project.org  
- **一般問い合わせ**: support@rimor-project.org

---

**免責事項**: このガイドラインは Rimor v0.4.1 時点での情報に基づいています。セキュリティ要件は継続的に変化するため、定期的な見直しと更新を行ってください。

**作成者**: Claude Code AI Assistant  
**承認者**: Rimor Development Team  
**次回レビュー**: 2025年10月24日