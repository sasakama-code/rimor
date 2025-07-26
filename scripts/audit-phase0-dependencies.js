#!/usr/bin/env node

/**
 * Phase 0: 依存関係・環境監査スクリプト
 * 
 * 業界標準のサプライチェーンセキュリティ監査を実装
 * - npm audit (脆弱性監査)
 * - ライセンス互換性チェック  
 * - パッケージバージョン監査
 * - 環境設定監査
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// ====================================================================
// 設定とユーティリティ
// ====================================================================

const argv = yargs(hideBin(process.argv))
  .option('output', {
    alias: 'o',
    type: 'string',
    description: '出力ファイルパス',
    default: 'phase0-dependencies.json'
  })
  .option('format', {
    alias: 'f',
    type: 'string',
    choices: ['json', 'markdown', 'html', 'csv'],
    description: '出力形式',
    default: 'json'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: '詳細ログ出力',
    default: false
  })
  .option('parallel', {
    type: 'boolean',
    description: '並列実行',
    default: true
  })
  .help()
  .argv;

// ログ出力関数
const log = {
  info: (msg) => argv.verbose && console.log(`ℹ️  ${msg}`),
  success: (msg) => argv.verbose && console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`)
};

// ====================================================================
// 依存関係監査クラス
// ====================================================================

class DependencyAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      phase: '0',
      name: '依存関係・環境監査',
      summary: {
        totalPackages: 0,
        vulnerabilities: {
          critical: 0,
          high: 0,
          moderate: 0,
          low: 0,
          info: 0
        },
        licenseIssues: 0,
        outdatedPackages: 0,
        environmentIssues: 0
      },
      details: {
        npmAudit: null,
        licenseAudit: null,
        versionAudit: null,
        environmentAudit: null
      },
      recommendations: [],
      executionTime: 0
    };
  }

  /**
   * npm audit実行
   */
  async runNpmAudit() {
    log.info('npm audit実行中...');
    
    try {
      // npm audit --json で詳細情報取得
      const auditOutput = execSync('npm audit --json', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'] // stderrを無視（audit結果は正常でもstderrに出力される）
      });
      
      const auditData = JSON.parse(auditOutput);
      
      this.results.details.npmAudit = {
        success: true,
        vulnerabilities: auditData.vulnerabilities || {},
        metadata: auditData.metadata || {},
        advisories: auditData.advisories || {}
      };

      // 脆弱性カウント
      if (auditData.metadata && auditData.metadata.vulnerabilities) {
        const vulns = auditData.metadata.vulnerabilities;
        this.results.summary.vulnerabilities = {
          critical: vulns.critical || 0,
          high: vulns.high || 0,
          moderate: vulns.moderate || 0,
          low: vulns.low || 0,
          info: vulns.info || 0
        };
      }

      // 推奨事項生成
      const totalVulns = Object.values(this.results.summary.vulnerabilities)
        .reduce((sum, count) => sum + count, 0);
      
      if (totalVulns > 0) {
        this.results.recommendations.push({
          priority: 'high',
          category: 'security',
          title: `${totalVulns}個の脆弱性が検出されました`,
          description: 'npm audit fix を実行して修正可能な脆弱性を修正してください',
          command: 'npm audit fix',
          impact: totalVulns > 10 ? 'critical' : totalVulns > 5 ? 'high' : 'medium'
        });
      }

      log.success(`npm audit完了: ${totalVulns}個の脆弱性検出`);
      
    } catch (error) {
      log.warning('npm auditでエラーが発生しましたが、続行します');
      this.results.details.npmAudit = {
        success: false,
        error: error.message,
        note: 'npm auditは脆弱性が存在する場合に非0のexit codeを返すことがあります'
      };
    }
  }

  /**
   * ライセンス監査実行
   */
  async runLicenseAudit() {
    log.info('ライセンス互換性監査実行中...');
    
    try {
      // package.jsonから依存関係を取得
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const licenseInfo = {};
      const problematicLicenses = ['GPL-3.0', 'AGPL-3.0', 'LGPL-3.0'];
      let licenseIssues = 0;

      // 主要パッケージのライセンス確認（簡易版）
      const majorPackages = Object.keys(dependencies).slice(0, 10);
      
      for (const pkg of majorPackages) {
        try {
          const pkgPath = path.join('node_modules', pkg, 'package.json');
          if (fs.existsSync(pkgPath)) {
            const pkgInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            const license = pkgInfo.license || 'Unknown';
            licenseInfo[pkg] = license;
            
            if (problematicLicenses.includes(license)) {
              licenseIssues++;
            }
          }
        } catch (err) {
          licenseInfo[pkg] = 'Error reading license';
        }
      }

      this.results.details.licenseAudit = {
        success: true,
        licenses: licenseInfo,
        problematicCount: licenseIssues,
        problematicLicenses: problematicLicenses
      };

      this.results.summary.licenseIssues = licenseIssues;

      if (licenseIssues > 0) {
        this.results.recommendations.push({
          priority: 'medium',
          category: 'legal',
          title: `${licenseIssues}個の問題のあるライセンスが検出されました`,
          description: 'GPL系ライセンスは商用利用に制限があります。法務部門に相談してください',
          impact: 'medium'
        });
      }

      log.success(`ライセンス監査完了: ${licenseIssues}個の問題検出`);
      
    } catch (error) {
      log.error(`ライセンス監査エラー: ${error.message}`);
      this.results.details.licenseAudit = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * パッケージバージョン監査
   */
  async runVersionAudit() {
    log.info('パッケージバージョン監査実行中...');
    
    try {
      // npm outdated --json で古いパッケージ情報取得
      let outdatedOutput = '{}';
      try {
        outdatedOutput = execSync('npm outdated --json', { 
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore']
        });
      } catch (error) {
        // npm outdatedは古いパッケージがある場合に非0で終了するため、エラーを捕捉
        outdatedOutput = error.stdout || '{}';
      }

      const outdatedData = JSON.parse(outdatedOutput);
      const outdatedCount = Object.keys(outdatedData).length;

      this.results.details.versionAudit = {
        success: true,
        outdatedPackages: outdatedData,
        outdatedCount: outdatedCount
      };

      this.results.summary.outdatedPackages = outdatedCount;

      if (outdatedCount > 0) {
        const majorUpdates = Object.entries(outdatedData)
          .filter(([_, info]) => {
            const current = info.current?.split('.')[0];
            const latest = info.latest?.split('.')[0];
            return current !== latest;
          }).length;

        this.results.recommendations.push({
          priority: majorUpdates > 0 ? 'medium' : 'low',
          category: 'maintenance',
          title: `${outdatedCount}個の古いパッケージが検出されました`,
          description: `このうち${majorUpdates}個はメジャーバージョンアップが利用可能です`,
          command: 'npm update',
          impact: majorUpdates > 3 ? 'medium' : 'low'
        });
      }

      log.success(`バージョン監査完了: ${outdatedCount}個の古いパッケージ検出`);
      
    } catch (error) {
      log.error(`バージョン監査エラー: ${error.message}`);
      this.results.details.versionAudit = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 環境設定監査
   */
  async runEnvironmentAudit() {
    log.info('環境設定監査実行中...');
    
    try {
      const environmentInfo = {
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch
        },
        npm: {
          version: execSync('npm --version', { encoding: 'utf8' }).trim()
        },
        typescript: null,
        packageManager: 'npm'
      };

      // TypeScriptバージョン確認
      try {
        const tsVersion = execSync('npx tsc --version', { encoding: 'utf8' }).trim();
        environmentInfo.typescript = tsVersion;
      } catch (err) {
        environmentInfo.typescript = 'Not installed';
      }

      // package.jsonの設定確認
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      const configIssues = [];
      
      // Node.jsバージョン要件確認
      if (packageJson.engines && packageJson.engines.node) {
        const requiredNode = packageJson.engines.node;
        environmentInfo.node.required = requiredNode;
        
        // 簡易バージョンチェック（完全なsemverパースは省略）
        const currentMajor = parseInt(process.version.substring(1));
        const requiredMajor = parseInt(requiredNode.replace(/[^0-9]/g, ''));
        
        if (currentMajor < requiredMajor) {
          configIssues.push('Node.jsバージョンが要求より古い');
        }
      }

      // セキュリティ設定確認
      const securitySettings = {
        hasLockFile: fs.existsSync('package-lock.json'),
        hasSecurityConfig: fs.existsSync('.npmrc'),
        hasGitIgnore: fs.existsSync('.gitignore')
      };

      if (!securitySettings.hasLockFile) {
        configIssues.push('package-lock.jsonが存在しない');
      }

      this.results.details.environmentAudit = {
        success: true,
        environment: environmentInfo,
        security: securitySettings,
        issues: configIssues
      };

      this.results.summary.environmentIssues = configIssues.length;

      if (configIssues.length > 0) {
        this.results.recommendations.push({
          priority: 'medium',
          category: 'environment',
          title: `${configIssues.length}個の環境設定問題が検出されました`,
          description: configIssues.join(', '),
          impact: 'medium'
        });
      }

      log.success(`環境監査完了: ${configIssues.length}個の問題検出`);
      
    } catch (error) {
      log.error(`環境監査エラー: ${error.message}`);
      this.results.details.environmentAudit = {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 全監査実行
   */
  async runAll() {
    const startTime = Date.now();
    
    log.info('Phase 0: 依存関係・環境監査開始');

    if (argv.parallel) {
      // 並列実行
      await Promise.all([
        this.runNpmAudit(),
        this.runLicenseAudit(),
        this.runVersionAudit(),
        this.runEnvironmentAudit()
      ]);
    } else {
      // 順次実行
      await this.runNpmAudit();
      await this.runLicenseAudit();
      await this.runVersionAudit();
      await this.runEnvironmentAudit();
    }

    this.results.executionTime = Date.now() - startTime;
    
    // 総パッケージ数算出
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      this.results.summary.totalPackages = 
        Object.keys(packageJson.dependencies || {}).length +
        Object.keys(packageJson.devDependencies || {}).length;
    } catch (err) {
      this.results.summary.totalPackages = 0;
    }

    log.success(`Phase 0完了: ${this.results.executionTime}ms`);
    
    return this.results;
  }

  /**
   * 結果を指定形式で出力
   */
  async saveResults(outputPath, format) {
    let content;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(this.results, null, 2);
        break;
        
      case 'markdown':
        content = this.generateMarkdownReport();
        break;
        
      case 'html':
        content = this.generateHtmlReport();
        break;
        
      case 'csv':
        content = this.generateCsvReport();
        break;
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
    
    fs.writeFileSync(outputPath, content, 'utf8');
    log.success(`結果保存: ${outputPath}`);
  }

  /**
   * Markdownレポート生成
   */
  generateMarkdownReport() {
    const { summary, recommendations } = this.results;
    
    return `# Phase 0: 依存関係・環境監査結果

## サマリー
- **総パッケージ数**: ${summary.totalPackages}
- **脆弱性**: Critical: ${summary.vulnerabilities.critical}, High: ${summary.vulnerabilities.high}, Moderate: ${summary.vulnerabilities.moderate}, Low: ${summary.vulnerabilities.low}
- **ライセンス問題**: ${summary.licenseIssues}件
- **古いパッケージ**: ${summary.outdatedPackages}件
- **環境設定問題**: ${summary.environmentIssues}件

## 推奨事項
${recommendations.map(rec => 
  `### ${rec.title} (${rec.priority})\n${rec.description}\n${rec.command ? `\`\`\`bash\n${rec.command}\n\`\`\`` : ''}`
).join('\n\n')}

---
*実行時間: ${this.results.executionTime}ms*
`;
  }

  /**
   * HTMLレポート生成
   */
  generateHtmlReport() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Phase 0: 依存関係・環境監査結果</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .critical { color: #d32f2f; }
        .high { color: #f57c00; }
        .medium { color: #fbc02d; }
        .low { color: #388e3c; }
    </style>
</head>
<body>
    <h1>Phase 0: 依存関係・環境監査結果</h1>
    <div class="summary">
        <h2>サマリー</h2>
        <p>総パッケージ数: ${this.results.summary.totalPackages}</p>
        <p>脆弱性: <span class="critical">${this.results.summary.vulnerabilities.critical} Critical</span>, 
           <span class="high">${this.results.summary.vulnerabilities.high} High</span>, 
           <span class="medium">${this.results.summary.vulnerabilities.moderate} Moderate</span>, 
           <span class="low">${this.results.summary.vulnerabilities.low} Low</span></p>
    </div>
    <h2>推奨事項</h2>
    ${this.results.recommendations.map(rec => 
      `<div class="recommendation ${rec.priority}">
         <h3>${rec.title}</h3>
         <p>${rec.description}</p>
         ${rec.command ? `<code>${rec.command}</code>` : ''}
       </div>`
    ).join('')}
</body>
</html>`;
  }

  /**
   * CSVレポート生成
   */
  generateCsvReport() {
    const header = 'Type,Priority,Title,Description,Command,Impact\n';
    const rows = this.results.recommendations.map(rec => 
      `"${rec.category}","${rec.priority}","${rec.title}","${rec.description}","${rec.command || ''}","${rec.impact}"`
    ).join('\n');
    
    return header + rows;
  }
}

// ====================================================================
// メイン実行
// ====================================================================

async function main() {
  try {
    const auditor = new DependencyAuditor();
    const results = await auditor.runAll();
    
    await auditor.saveResults(argv.output, argv.format);
    
    // 重要な問題がある場合は警告表示
    const totalVulns = Object.values(results.summary.vulnerabilities)
      .reduce((sum, count) => sum + count, 0);
    
    if (totalVulns > 0 || results.summary.licenseIssues > 0) {
      log.warning(`重要な問題が検出されました。詳細は ${argv.output} を確認してください。`);
    }
    
  } catch (error) {
    log.error(`Phase 0実行エラー: ${error.message}`);
    process.exit(1);
  }
}

// スクリプトとして実行された場合のみmain()を呼び出し
if (require.main === module) {
  main();
}

module.exports = { DependencyAuditor };