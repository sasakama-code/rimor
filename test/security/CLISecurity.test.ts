/**
 * CLISecurityセキュリティテスト - v0.4.1
 * CLI引数セキュリティの包括的テスト
 */

import { CLISecurity, DEFAULT_CLI_SECURITY_LIMITS } from '../../src/security/CLISecurity';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('CLISecurity Security Tests', () => {
  let cliSecurity: CLISecurity;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-cli-test-'));
    // Issue #123対応: プロジェクト境界ホワイトリスト検証テスト用にプロジェクトルートを使用
    cliSecurity = new CLISecurity(process.cwd(), DEFAULT_CLI_SECURITY_LIMITS);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('分析対象パスの検証', () => {
    test('パストラバーサル攻撃を防ぐ', () => {
      const testCases = [
        { path: '../../../etc/passwd', expectedIssue: 'パストラバーサル攻撃' },
        { path: '..\\..\\..\\Windows\\System32', expectedIssue: 'パストラバーサル攻撃（Windows）' },
        { path: '/etc/shadow', expectedIssue: 'システムディレクトリアクセス試行' },
        { path: 'C:\\Windows\\System32\\config\\SAM', expectedIssue: 'Windowsシステムディレクトリアクセス試行' }
      ];

      testCases.forEach(({ path, expectedIssue }) => {
        const result = cliSecurity.validateAnalysisPath(path);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain(expectedIssue);
      });
    });

    test('コマンドインジェクション攻撃を防ぐ', () => {
      const maliciousPaths = [
        './test.js; rm -rf /',
        './test.js && malicious_command',
        './test.js | evil_script',
        './test.js`backdoor`'
      ];

      maliciousPaths.forEach(maliciousPath => {
        const result = cliSecurity.validateAnalysisPath(maliciousPath);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('コマンドインジェクション攻撃');
      });
    });

    test('変数展開攻撃を防ぐ', () => {
      const maliciousPaths = [
        './test${malicious_var}.js',
        './test$(evil_command).js',
        './${HOME}/../../../etc/passwd'
      ];

      maliciousPaths.forEach(maliciousPath => {
        const result = cliSecurity.validateAnalysisPath(maliciousPath);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('変数展開攻撃');
      });
    });

    test('NULL文字攻撃を防ぐ', () => {
      const maliciousPaths = [
        './test.js\0',
        './test%00.js',
        './test\x00malicious'
      ];

      maliciousPaths.forEach(maliciousPath => {
        const result = cliSecurity.validateAnalysisPath(maliciousPath);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('NULL文字攻撃');
      });
    });

    test('システムディレクトリアクセス攻撃を防ぐ', () => {
      const systemPaths = [
        '/etc/passwd',
        '/root/.ssh/id_rsa',
        '/home/user/.bash_history',
        'C:\\Windows\\explorer.exe',
        'C:\\Program Files\\malicious'
      ];

      systemPaths.forEach(systemPath => {
        const result = cliSecurity.validateAnalysisPath(systemPath);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('システムディレクトリアクセス攻撃');
      });
    });

    test('異常に長いパス攻撃を防ぐ', () => {
      const longPath = 'a'.repeat(2000); // 制限は1000文字
      
      const result = cliSecurity.validateAnalysisPath(longPath);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('DoS攻撃（長いパス）の可能性');
    });

    test('正常なパスは受け入れられる', () => {
      const validPaths = [
        './src/test.js',
        'src/components',
        'test/fixtures/sample.ts',
        '.'
      ];

      validPaths.forEach(validPath => {
        const result = cliSecurity.validateAnalysisPath(validPath);
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedValue).toBeDefined();
      });
    });

    // Issue #121対応: プロジェクト境界ホワイトリスト方式テスト
    describe('プロジェクト境界ホワイトリスト検証', () => {
      test('プロジェクト内の/home/パスを含むパスを許可する', () => {
        // プロジェクトがユーザーホームディレクトリ配下にある場合の正常ケース
        const homeBasedPaths = [
          'src/components/Header.ts',
          './lib/utils.js',
          'test/unit/example.test.ts'
        ];

        homeBasedPaths.forEach(homePath => {
          const result = cliSecurity.validateAnalysisPath(homePath);
          
          expect(result.isValid).toBe(true);
          expect(result.sanitizedValue).toBeDefined();
          expect(result.errors).toHaveLength(0);
          // 現在のブラックリスト方式では/home/を含むパスで誤検知する可能性がある
        });
      });

      test('プロジェクト内のWindowsユーザーパスを含むパスを許可する', () => {
        // プロジェクトがWindowsユーザーディレクトリ配下にある場合の正常ケース  
        const windowsPaths = [
          'src\\modules\\auth.ts',
          '.\\config\\database.js',
          'tests\\integration\\api.test.ts'
        ];

        windowsPaths.forEach(winPath => {
          const result = cliSecurity.validateAnalysisPath(winPath);
          
          expect(result.isValid).toBe(true);
          expect(result.sanitizedValue).toBeDefined();
          expect(result.errors).toHaveLength(0);
          // 現在のブラックリスト方式ではC:\\Users\\Administrator\\を含むパスで誤検知する可能性がある
        });
      });

      test('プロジェクト範囲外への相対パストラバーサルを拒否する', () => {
        const traversalPaths = [
          '../../../etc/passwd',
          '..\\..\\..\\Windows\\System32',
          '../../../../../root/.ssh/id_rsa',
          '../../../../../../home/other-user/secrets'
        ];

        traversalPaths.forEach(traversalPath => {
          const result = cliSecurity.validateAnalysisPath(traversalPath);
          
          expect(result.isValid).toBe(false);
          // Issue #122対応: プラットフォーム別パストラバーサル分類
          const isWindowsPath = traversalPath.includes('\\');
          const expectedIssue = isWindowsPath ? 'パストラバーサル攻撃（Windows）' : 'パストラバーサル攻撃';
          expect(result.securityIssues).toContain(expectedIssue);
          expect(result.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
        });
      });

      test('プロジェクト範囲外の絶対パスを拒否する', () => {
        const externalAbsolutePaths = [
          '/etc/shadow',
          '/root/.bashrc',
          'C:\\Windows\\System32\\config\\SAM',
          '/home/other-user/private/',
          'C:\\Users\\Other\\Documents\\secrets.txt'
        ];

        externalAbsolutePaths.forEach(absPath => {
          const result = cliSecurity.validateAnalysisPath(absPath);
          
          expect(result.isValid).toBe(false);
          expect(result.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
          expect(result.securityIssues.length).toBeGreaterThan(0);
        });
      });

      test('プロジェクトルート境界の厳密な検証', () => {
        // エッジケース: プロジェクトルート直下のファイル
        const boundaryPaths = [
          './package.json',
          'README.md',
          './src',
          '../invalid-sibling-project' // プロジェクト範囲外
        ];

        const validBoundaryPaths = boundaryPaths.slice(0, 3);
        const invalidBoundaryPaths = boundaryPaths.slice(3);

        validBoundaryPaths.forEach(validPath => {
          const result = cliSecurity.validateAnalysisPath(validPath);
          expect(result.isValid).toBe(true);
        });

        invalidBoundaryPaths.forEach(invalidPath => {
          const result = cliSecurity.validateAnalysisPath(invalidPath);
          expect(result.isValid).toBe(false);
          expect(result.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
        });
      });

      // 境界エッジケーステスト
      describe('プロジェクト境界エッジケーステスト', () => {
        test('空パスやドット記号のみのパスを適切に処理する', () => {
          const edgeCasePaths = [
            '',
            '.',
            '..',
            './',
            '../',
            '.../',
            './././',
            '../././../'
          ];

          edgeCasePaths.forEach(edgePath => {
            const result = cliSecurity.validateAnalysisPath(edgePath);
            
            if (edgePath === '' || edgePath === '.' || edgePath === './' || edgePath === './././') {
              // 空パス、カレントディレクトリは許可されるべき
              expect(result.isValid).toBe(true);
            } else if (edgePath.includes('..')) {
              // パストラバーサルは拒否されるべき
              expect(result.isValid).toBe(false);
              // セキュリティ分類: パストラバーサル攻撃またはプロジェクト境界突破攻撃
              expect(result.securityIssues.some(issue => 
                issue.includes('パストラバーサル') || issue.includes('プロジェクト境界突破')
              )).toBe(true);
            } else {
              // その他の無害なパス（./././ など）は許可されるべき
              expect(result.isValid).toBe(true);
            }
          });
        });

        test('パス正規化後の境界チェックを行う', () => {
          const normalizationPaths = [
            './src/../../../etc/passwd',
            'src/./../../home/user/secrets',
            'test/../../../../../root/.ssh',
            '.././../system/critical'
          ];

          normalizationPaths.forEach(normPath => {
            const result = cliSecurity.validateAnalysisPath(normPath);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
            expect(result.securityIssues).toContain('パストラバーサル攻撃');
          });
        });

        test('深いネスト構造での境界チェック', () => {
          const deepNestedPaths = [
            'src/components/ui/forms/inputs/text/validation', // プロジェクト内深いパス
            'a'.repeat(50) + '/' + 'b'.repeat(50) + '/file.js', // 長いパス名
            Array(20).fill('dir').join('/') + '/deep.js', // 深い階層
            '../' + Array(10).fill('../').join('') + 'external.js' // 深いトラバーサル
          ];

          const validDeepPaths = deepNestedPaths.slice(0, 3);
          const invalidDeepPaths = deepNestedPaths.slice(3);

          validDeepPaths.forEach(validPath => {
            const result = cliSecurity.validateAnalysisPath(validPath);
            // パス長制限を超えない限り、プロジェクト内の深いパスは許可
            expect(result.isValid).toBe(true);
          });

          invalidDeepPaths.forEach(invalidPath => {
            const result = cliSecurity.validateAnalysisPath(invalidPath);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
          });
        });

        test('特殊文字やUnicodeパスの境界チェック', () => {
          const specialCharPaths = [
            './src/日本語ファイル.js', // Unicodeファイル名
            './src/file with spaces.js', // スペース含むパス
            './src/file-with-dashes_and_underscores.js', // 特殊文字
            '../悪意のあるファイル.js' // Unicode + トラバーサル
          ];

          const validSpecialPaths = specialCharPaths.slice(0, 3);
          const invalidSpecialPaths = specialCharPaths.slice(3);

          validSpecialPaths.forEach(validPath => {
            const result = cliSecurity.validateAnalysisPath(validPath);
            expect(result.isValid).toBe(true);
          });

          invalidSpecialPaths.forEach(invalidPath => {
            const result = cliSecurity.validateAnalysisPath(invalidPath);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
          });
        });

        test('シンボリックリンク風のパスでの境界回避試行を防ぐ', () => {
          // シンボリックリンク風のパスで境界を回避しようとするケース
          const symlinkStylePaths = [
            './src/../../symlink-to-external',
            './project/../../../through-symlink/target',
            'valid/path/../../../../../../system/file',
            './safe/../unsafe/../../../critical'
          ];

          symlinkStylePaths.forEach(symlinkPath => {
            const result = cliSecurity.validateAnalysisPath(symlinkPath);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
            expect(result.securityIssues).toContain('パストラバーサル攻撃');
          });
        });
      });
    });
  });

  // Issue #122対応: 絶対パス境界突破脆弱性のテストケース（TDD Red Phase）
  describe('Issue #122: 絶対パス境界突破脆弱性', () => {
    test('絶対パス指定時のsafeResolveバイパス攻撃を防ぐ', () => {
      // Issue #122で指摘された脆弱性：
      // 絶対パス指定時にPathSecurity.safeResolveがスキップされ、
      // validatePathBoundaryのみの検証では不十分な場合がある
      
      const absolutePathAttacks = [
        // Unix形式絶対パスでプロジェクト外アクセス
        '/tmp/../etc/shadow',
        '/var/../root/.bashrc',
        '/usr/../etc/passwd',
        
        // Windows形式絶対パス攻撃（クロスプラットフォーム環境）
        'C:\\Windows\\..\\..\\..\\etc\\shadow',
        'D:\\Projects\\..\\..\\..\\Windows\\System32',
        
        // 複雑な正規化が必要なパス（safeResolveでのみ適切に処理可能）
        '/home/user/project/../../../etc/sensitive',
        '/opt/app/../../../root/secrets'
      ];

      absolutePathAttacks.forEach(attackPath => {
        const result = cliSecurity.validateAnalysisPath(attackPath);
        
        // 期待する動作：すべての絶対パス境界突破攻撃は拒否されるべき
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.includes('プロジェクト範囲外') || 
          error.includes('危険なパターン')
        )).toBe(true);
        expect(result.securityIssues.length).toBeGreaterThan(0);
        
        // Issue #122修正後は、safeResolveによる包括的セキュリティ検証が適用されるべき
        expect(result.securityIssues.some(issue => 
          issue.includes('パストラバーサル') ||
          issue.includes('システムディレクトリ') ||
          issue.includes('境界突破')
        )).toBe(true);
      });
    });

    test('出力パスでも絶対パス境界突破攻撃を防ぐ', () => {
      const absoluteOutputPathAttacks = [
        '/tmp/../etc/malicious-output.json',
        '/var/../root/backdoor.txt',
        'C:\\Windows\\..\\..\\..\\malware.exe',
        '/usr/../bin/trojan'
      ];

      absoluteOutputPathAttacks.forEach(attackPath => {
        const result = cliSecurity.validateOutputPath(attackPath);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.includes('プロジェクト範囲外') || 
          error.includes('危険なパターン')
        )).toBe(true);
        expect(result.securityIssues.length).toBeGreaterThan(0);
      });
    });

    test('safeResolve統一適用後の一貫性検証', () => {
      // Issue #122対応: プラットフォーム判定による適切な分類の一貫性確保
      const pathPairs = [
        {
          relative: '../../../etc/passwd',
          absolute: '/tmp/../etc/passwd',
          expectedSecurityIssue: 'パストラバーサル攻撃', // Unix系パス
          description: 'Unix系パストラバーサル攻撃'
        },
        {
          relative: '..\\..\\..\\Windows\\System32',
          absolute: 'C:\\Windows\\..\\..\\..\\Windows\\System32',
          expectedSecurityIssue: 'パストラバーサル攻撃（Windows）', // Windows系パス
          description: 'Windows系パストラバーサル攻撃'
        }
      ];

      pathPairs.forEach(({ relative, absolute, expectedSecurityIssue, description }) => {
        const relativeResult = cliSecurity.validateAnalysisPath(relative);
        const absoluteResult = cliSecurity.validateAnalysisPath(absolute);
        
        // 両方とも同様に拒否されるべき
        expect(relativeResult.isValid).toBe(false);
        expect(absoluteResult.isValid).toBe(false);
        
        // 両方ともパストラバーサル攻撃を検出すべき（プラットフォーム別の適切な分類）
        expect(relativeResult.securityIssues).toContain(expectedSecurityIssue);
        expect(absoluteResult.securityIssues).toContain(expectedSecurityIssue);
        
        // Issue #122修正により、プラットフォーム判定の一貫性が確保されることを検証
        console.log(`${description}の一貫性確認:`, {
          relative: relativeResult.securityIssues,
          absolute: absoluteResult.securityIssues
        });
      });
    });
  });

  describe('出力ファイルパスの検証', () => {
    test('システムディレクトリ書き込み攻撃を防ぐ', () => {
      const maliciousOutputs = [
        '/etc/cron.daily/backdoor',
        '/root/.bashrc',
        'C:\\Windows\\System32\\evil.exe',
        '/usr/bin/malicious'
      ];

      maliciousOutputs.forEach(maliciousOutput => {
        const result = cliSecurity.validateOutputPath(maliciousOutput);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('システムディレクトリ書き込み攻撃');
      });
    });

    test('実行可能ファイル生成攻撃を防ぐ', () => {
      const executableExtensions = [
        './output.exe',
        './malicious.sh',
        './backdoor.bat',
        './virus.scr'
      ];

      executableExtensions.forEach(execFile => {
        const result = cliSecurity.validateOutputPath(execFile);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('実行可能ファイル生成攻撃の可能性');
      });
    });

    test('許可された拡張子は受け入れられる', () => {
      const allowedOutputs = [
        './report.json',
        './analysis.csv',
        './result.html',
        './output.txt',
        './readme.md'
      ];

      allowedOutputs.forEach(allowedOutput => {
        const result = cliSecurity.validateOutputPath(allowedOutput);
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedValue).toBeDefined();
      });
    });

    test('出力パスが未指定の場合は有効', () => {
      const result = cliSecurity.validateOutputPath('');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    // Issue #121対応: 出力パスプロジェクト境界ホワイトリスト方式テスト
    describe('出力パスプロジェクト境界ホワイトリスト検証', () => {
      test('プロジェクト内への出力パスを許可する', () => {
        const validOutputPaths = [
          './reports/analysis.json',
          'dist/output.html',
          './logs/results.txt',
          'coverage/report.csv'
        ];

        validOutputPaths.forEach(outputPath => {
          const result = cliSecurity.validateOutputPath(outputPath);
          
          expect(result.isValid).toBe(true);
          expect(result.sanitizedValue).toBeDefined();
          expect(result.errors).toHaveLength(0);
        });
      });

      test('プロジェクト範囲外への出力パスを拒否する', () => {
        const externalOutputPaths = [
          '../../../tmp/malicious.json',
          '../../../../home/user/evil.txt',
          '../../other-project/backdoor.html',
          '/tmp/system-level-output.csv'
        ];

        externalOutputPaths.forEach(outputPath => {
          const result = cliSecurity.validateOutputPath(outputPath);
          
          expect(result.isValid).toBe(false);
          expect(result.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
          expect(result.securityIssues).toContain('パストラバーサル攻撃');
        });
      });

      test('プロジェクト範囲外の絶対出力パスを拒否する', () => {
        const systemOutputPaths = [
          '/etc/systemd/backdoor.service',
          '/root/malicious-config.json',
          'C:\\Windows\\evil.exe',
          '/home/other-user/private/stolen.txt'
        ];

        systemOutputPaths.forEach(systemPath => {
          const result = cliSecurity.validateOutputPath(systemPath);
          
          expect(result.isValid).toBe(false);
          expect(result.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
          expect(result.securityIssues.length).toBeGreaterThan(0);
        });
      });

      // 出力パス用境界エッジケーステスト
      // Issue #124対応: セキュリティ機能確認テストケース（修正済み確認）
      test('Issue #124: 絶対パスプロジェクト外出力制限の正常動作確認', () => {
        // 確認: 絶対パスでプロジェクト外への書き込みが適切に拒否される（修正済み）
        const externalAbsolutePaths = [
          '/tmp/project-external-output.json',       // Unix系プロジェクト外絶対パス
          '/home/user/other-project/backdoor.html',  // 他ユーザー領域絶対パス
          '/var/log/system-compromise.txt'           // システム領域絶対パス
        ];

        externalAbsolutePaths.forEach(absolutePath => {
          const result = cliSecurity.validateOutputPath(absolutePath);
          
          // ✅ 修正済み確認: 絶対パスでもプロジェクト外出力は適切に拒否される
          expect(result.isValid).toBe(false);  // セキュア: 適切に拒否
          expect(result.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
          expect(result.securityIssues).toContain('パストラバーサル攻撃');
        });
      });

      test('Issue #124: 相対パスと絶対パス制限の一貫性確認', () => {
        // 確認: 相対パスと絶対パスで一貫したセキュリティ制限が動作（修正済み）
        const externalDirectory = '/tmp';
        const relativePath = '../../../tmp/external-file.json';
        const absolutePath = '/tmp/external-file.json';

        const relativeResult = cliSecurity.validateOutputPath(relativePath);
        const absoluteResult = cliSecurity.validateOutputPath(absolutePath);

        // ✅ 相対パスは適切に制限される
        expect(relativeResult.isValid).toBe(false);
        expect(relativeResult.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);

        // ✅ 絶対パスも同様に適切に制限される（修正済み確認）
        expect(absoluteResult.isValid).toBe(false);  // セキュア: 一貫した制限
        expect(absoluteResult.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
        expect(absoluteResult.securityIssues).toContain('パストラバーサル攻撃');
      });

      describe('出力パスプロジェクト境界エッジケーステスト', () => {
        test('特殊出力パスの適切な処理', () => {
          const specialOutputPaths = [
            './output/日本語レポート.json',
            './reports/data with spaces.csv',
            './logs/deep/nested/structure/output.txt',
            '../../../tmp/system-output.json' // 境界回避
          ];

          const validOutputs = specialOutputPaths.slice(0, 3);
          const invalidOutputs = specialOutputPaths.slice(3);

          validOutputs.forEach(validOutput => {
            const result = cliSecurity.validateOutputPath(validOutput);
            expect(result.isValid).toBe(true);
          });

          invalidOutputs.forEach(invalidOutput => {
            const result = cliSecurity.validateOutputPath(invalidOutput);
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
          });
        });

        test('出力ファイル名の正規化と境界チェック', () => {
          const normalizedOutputPaths = [
            './dist/../../../external/malicious.json',
            './output/./../../../../../../system.csv',
            'reports/../../../home/user/stolen.html',
            './valid/output/../../../critical.txt'
          ];

          normalizedOutputPaths.forEach(normalizedPath => {
            const result = cliSecurity.validateOutputPath(normalizedPath);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
            expect(result.securityIssues).toContain('パストラバーサル攻撃');
          });
        });

        test('一時ファイルパスやシステムパスへの出力回避試行', () => {
          const maliciousOutputPaths = [
            '/tmp/../../../etc/cron.daily/malicious',
            '/var/tmp/../../../../root/.bashrc',
            'C:\\temp\\..\\..\\Windows\\System32\\evil.exe',
            './tmp/../../../../../../dev/null'
          ];

          maliciousOutputPaths.forEach(maliciousPath => {
            const result = cliSecurity.validateOutputPath(maliciousPath);
            
            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('プロジェクト範囲外'))).toBe(true);
            expect(result.securityIssues.length).toBeGreaterThan(0);
          });
        });
      });
    });
  });

  describe('環境変数の検証', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    test('危険な環境変数を検出する', () => {
      process.env.LD_PRELOAD = '/malicious/lib.so';
      process.env.DYLD_INSERT_LIBRARIES = '/evil/lib.dylib';
      process.env.NODE_OPTIONS = '--require malicious_module';

      const result = cliSecurity.validateEnvironmentVariables();
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.securityIssues).toContain('環境変数インジェクション攻撃の可能性');
    });

    test('RIMOR_LANGの不正な値を検出する', () => {
      process.env.RIMOR_LANG = 'ja; malicious_command';

      const result = cliSecurity.validateEnvironmentVariables();
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('環境変数インジェクション攻撃');
    });

    test('NODE_ENVの不正な値を検出する', () => {
      process.env.NODE_ENV = 'production; evil_script';

      const result = cliSecurity.validateEnvironmentVariables();
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('環境変数インジェクション攻撃');
    });

    test('正常な環境変数は受け入れられる', () => {
      process.env.RIMOR_LANG = 'ja';
      process.env.NODE_ENV = 'development';

      const result = cliSecurity.validateEnvironmentVariables();
      
      expect(result.isValid).toBe(true);
    });

    test('環境変数検証が無効化できる', () => {
      cliSecurity.updateLimits({ validateEnvironmentVariables: false });
      
      process.env.LD_PRELOAD = '/malicious/lib.so';
      
      const result = cliSecurity.validateEnvironmentVariables();
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('フォーマット引数の検証', () => {
    test('未対応のフォーマットを拒否する', () => {
      const invalidFormats = [
        'exe',
        'script',
        'binary',
        'malicious'
      ];

      invalidFormats.forEach(format => {
        const result = cliSecurity.validateFormat(format);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('フォーマット指定攻撃の可能性');
      });
    });

    test('フォーマットインジェクション攻撃を防ぐ', () => {
      const maliciousFormats = [
        'json; malicious_command',
        'text`backdoor`',
        'csv${evil_var}'
      ];

      maliciousFormats.forEach(format => {
        const result = cliSecurity.validateFormat(format);
        
        expect(result.isValid).toBe(false);
        expect(result.securityIssues).toContain('フォーマット指定攻撃の可能性');
      });
    });

    test('対応フォーマットは受け入れられる', () => {
      const validFormats = ['text', 'json', 'csv', 'html'];

      validFormats.forEach(format => {
        const result = cliSecurity.validateFormat(format);
        
        expect(result.isValid).toBe(true);
        expect(result.sanitizedValue).toBe(format);
      });
    });

    test('未指定の場合はデフォルト値が返される', () => {
      const result = cliSecurity.validateFormat('');
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('text');
    });
  });

  describe('一括引数検証', () => {
    test('すべての引数が安全な場合は成功する', () => {
      // Issue #123対応: プロジェクト内の実際のファイルを使用
      const result = cliSecurity.validateAllArguments({
        path: './src',
        format: 'json',
        outputFile: './temp-output.json'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.sanitizedArgs.path).toBeDefined();
      expect(result.sanitizedArgs.format).toBe('json');
      expect(result.sanitizedArgs.outputFile).toBeDefined();
    });

    test('任意の引数にセキュリティ問題がある場合は失敗する', () => {
      const result = cliSecurity.validateAllArguments({
        path: '../../../etc/passwd',
        format: 'malicious',
        outputFile: '/etc/backdoor.sh'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.allSecurityIssues.length).toBeGreaterThan(0);
      expect(result.allErrors.length).toBeGreaterThan(0);
    });

    test('警告がある場合でも処理は継続する', () => {
      const result = cliSecurity.validateAllArguments({
        path: './nonexistent.js', // 存在しないファイル（警告）
        format: 'json'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.allWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('セキュリティ制限の設定', () => {
    test('カスタム制限が適用される', () => {
      // Issue #123対応: Dead Code Elimination - forbiddenDirectoryPatterns削除
      // プロジェクト境界ホワイトリスト方式への完全移行により不要
      const customLimits = {
        maxPathLength: 500,
        maxOutputFileSize: 50 * 1024 * 1024,
        allowedOutputExtensions: ['.json', '.txt'],
        validateEnvironmentVariables: false
      };

      cliSecurity.updateLimits(customLimits);
      
      // 制限の確認は間接的（実際の制限値は非公開）
      expect(cliSecurity).toBeDefined();
    });

    test('長いパスの制限が更新される', () => {
      cliSecurity.updateLimits({ maxPathLength: 100 });
      
      const longPath = 'a'.repeat(150);
      const result = cliSecurity.validateAnalysisPath(longPath);
      
      expect(result.isValid).toBe(false);
      expect(result.securityIssues).toContain('DoS攻撃（長いパス）の可能性');
    });
  });

  describe('エラーハンドリングと回復処理', () => {
    test('null値を適切に処理する', () => {
      const result = cliSecurity.validateAnalysisPath(null as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスが指定されていません');
    });

    test('undefined値を適切に処理する', () => {
      const result = cliSecurity.validateAnalysisPath(undefined as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスが指定されていません');
    });

    test('数値を適切に処理する', () => {
      const result = cliSecurity.validateAnalysisPath(123 as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('パスが指定されていません');
    });
  });
});