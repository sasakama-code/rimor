import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { DictionaryVersioning, DiffVisualizer } from '../../../src/dictionary/storage/versioning';
import { DomainDictionary, BusinessRule, DomainTerm, DictionaryDiff } from '../../../src/core/types';
import { DomainTermManager } from '../../../src/dictionary/core/term';
import { BusinessRuleManager } from '../../../src/dictionary/core/rule';
import { errorHandler } from '../../../src/utils/errorHandler';

// モック設定
jest.mock('../../../src/utils/errorHandler');

const mockErrorHandler = errorHandler as jest.Mocked<typeof errorHandler>;

describe('DictionaryVersioning', () => {
  let versioning: DictionaryVersioning;
  let tempDir: string;
  let testDictionary: DomainDictionary;
  let modifiedDictionary: DomainDictionary;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 一時ディレクトリ作成
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-versioning-test-'));
    const versionsDir = path.join(tempDir, 'versions');
    
    versioning = new DictionaryVersioning({
      versionsDir,
      maxVersions: 5
    });

    // テスト用辞書データ作成
    testDictionary = {
      version: '1.0.0',
      domain: 'ecommerce',
      language: 'ja',
      lastUpdated: new Date('2024-01-01'),
      terms: [
        DomainTermManager.createTerm({
          id: 'payment-term',
          term: 'Payment',
          definition: 'Payment processing functionality',
          category: 'core-business',
          importance: 'critical',
          aliases: ['payment'],
          examples: [{ code: 'processPayment()', description: 'Process payment' }],
          relatedPatterns: ['payment.*'],
          testRequirements: ['Payment test']
        })
      ],
      relationships: [],
      businessRules: [
        BusinessRuleManager.createRule({
          id: 'payment-rule',
          name: 'Payment Validation',
          description: 'Payments must be validated',
          domain: 'ecommerce',
          condition: {
            type: 'function-name',
            pattern: 'payment.*',
            scope: 'function'
          },
          requirements: [{
            type: 'must-have',
            description: 'Payment validation test',
            testPattern: 'expect.*payment.*',
            example: 'expect(payment).toBeDefined()'
          }],
          priority: 10
        })
      ],
      qualityStandards: [],
      contextMappings: []
    };

    // 変更された辞書データ作成
    modifiedDictionary = {
      ...testDictionary,
      version: '1.1.0',
      terms: [
        ...testDictionary.terms,
        DomainTermManager.createTerm({
          id: 'user-term',
          term: 'User',
          definition: 'User management functionality',
          category: 'core-business',
          importance: 'high',
          aliases: ['user'],
          examples: [{ code: 'createUser()', description: 'Create user' }],
          relatedPatterns: ['user.*'],
          testRequirements: ['User test']
        })
      ]
    };
  });

  afterEach(() => {
    // 一時ディレクトリクリーンアップ
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('バージョン作成', () => {
    test('辞書の新しいバージョンが作成される', async () => {
      const version = await versioning.createVersion(
        testDictionary,
        'Initial version',
        { author: 'test' }
      );

      expect(version).toBeDefined();
      expect(version).toMatch(/^v\d+-[a-z0-9]+$/);

      // バージョンファイルが作成されることを確認
      const versionData = await versioning.getVersion(version);
      expect(versionData).toBeDefined();
      expect(versionData?.dictionary.version).toBe('1.0.0');
      expect(versionData?.metadata.message).toBe('Initial version');
      expect(versionData?.metadata.metadata.author).toBe('test');
    });

    test('メッセージとメタデータが省略可能', async () => {
      const version = await versioning.createVersion(testDictionary);

      const versionData = await versioning.getVersion(version);
      expect(versionData?.metadata.message).toContain('バージョン');
      expect(versionData?.metadata.metadata).toEqual({});
    });

    test('ハッシュ値が正しく計算される', async () => {
      const version = await versioning.createVersion(testDictionary);
      const versionData = await versioning.getVersion(version);

      expect(versionData?.metadata.hash).toBeDefined();
      expect(versionData?.metadata.hash).toHaveLength(16);
    });
  });

  describe('バージョン取得', () => {
    test('存在するバージョンが取得される', async () => {
      const version = await versioning.createVersion(testDictionary, 'Test version');
      const retrieved = await versioning.getVersion(version);

      expect(retrieved).toBeDefined();
      expect(retrieved?.dictionary.version).toBe('1.0.0');
      expect(retrieved?.metadata.version).toBe(version);
      expect(retrieved?.metadata.message).toBe('Test version');
    });

    test('存在しないバージョンではnullが返される', async () => {
      const result = await versioning.getVersion('non-existent-version');
      expect(result).toBeNull();
    });

    test('破損したバージョンファイルでnullが返される', async () => {
      // 不正なJSONファイルを作成
      const versionsDir = path.join(tempDir, 'versions');
      if (!fs.existsSync(versionsDir)) {
        fs.mkdirSync(versionsDir, { recursive: true });
      }
      
      const invalidFile = path.join(versionsDir, 'invalid.json');
      fs.writeFileSync(invalidFile, 'invalid json content');

      const result = await versioning.getVersion('invalid');
      expect(result).toBeNull();
    });
  });

  describe('バージョンリスト取得', () => {
    test('空のディレクトリでは空の配列が返される', async () => {
      const versions = await versioning.listVersions();
      expect(versions).toEqual([]);
    });

    test('複数のバージョンが新しい順でソートされる', async () => {
      // 複数のバージョンを作成（少し時間をずらす）
      const version1 = await versioning.createVersion(testDictionary, 'Version 1');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const version2 = await versioning.createVersion(modifiedDictionary, 'Version 2');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const version3 = await versioning.createVersion(testDictionary, 'Version 3');

      const versions = await versioning.listVersions();
      
      expect(versions).toHaveLength(3);
      expect(versions[0].version).toBe(version3); // 最新
      expect(versions[1].version).toBe(version2);
      expect(versions[2].version).toBe(version1); // 最古
      
      expect(versions[0].message).toBe('Version 3');
      expect(versions[1].message).toBe('Version 2');
      expect(versions[2].message).toBe('Version 1');
    });

    test('破損したバージョンファイルは無視される', async () => {
      const version1 = await versioning.createVersion(testDictionary, 'Valid version');
      
      // 不正なJSONファイルを作成
      const versionsDir = path.join(tempDir, 'versions');
      const invalidFile = path.join(versionsDir, 'invalid.json');
      fs.writeFileSync(invalidFile, 'invalid json');

      const versions = await versioning.listVersions();
      
      expect(versions).toHaveLength(1);
      expect(versions[0].version).toBe(version1);
    });
  });

  describe('差分計算', () => {
    test('2つのバージョン間の差分が計算される', async () => {
      const version1 = await versioning.createVersion(testDictionary, 'Original');
      const version2 = await versioning.createVersion(modifiedDictionary, 'Modified');

      const diff = await versioning.calculateDiff(version1, version2);

      expect(diff).toBeDefined();
      expect(diff?.added.terms).toHaveLength(1);
      expect(diff?.added.terms[0].term).toBe('User');
      expect(diff?.removed.terms).toHaveLength(0);
      expect(diff?.modified.terms).toHaveLength(0);
    });

    test('存在しないバージョンの差分計算でnullが返される', async () => {
      const version1 = await versioning.createVersion(testDictionary);
      const diff = await versioning.calculateDiff(version1, 'non-existent');

      expect(diff).toBeNull();
    });

    test('辞書オブジェクト間の直接差分計算', () => {
      const diff = versioning.computeDictionaryDiff(testDictionary, modifiedDictionary);

      expect(diff.added.terms).toHaveLength(1);
      expect(diff.added.terms[0].term).toBe('User');
      expect(diff.removed.terms).toHaveLength(0);
      expect(diff.modified.terms).toHaveLength(0);
    });

    test('用語の変更が検出される', () => {
      const originalTerm = testDictionary.terms[0];
      const modifiedTerm = {
        ...originalTerm,
        definition: 'Updated payment processing functionality'
      };

      const modified = {
        ...testDictionary,
        terms: [modifiedTerm]
      };

      const diff = versioning.computeDictionaryDiff(testDictionary, modified);

      expect(diff.modified.terms).toHaveLength(1);
      expect(diff.modified.terms[0].old.definition).toBe('Payment processing functionality');
      expect(diff.modified.terms[0].new.definition).toBe('Updated payment processing functionality');
    });

    test('ビジネスルールの変更が検出される', () => {
      const originalRule = testDictionary.businessRules[0];
      const modifiedRule = {
        ...originalRule,
        description: 'Updated payment validation rule'
      };

      const modified = {
        ...testDictionary,
        businessRules: [modifiedRule]
      };

      const diff = versioning.computeDictionaryDiff(testDictionary, modified);

      expect(diff.modified.rules).toHaveLength(1);
      expect(diff.modified.rules[0].old.description).toBe('Payments must be validated');
      expect(diff.modified.rules[0].new.description).toBe('Updated payment validation rule');
    });
  });

  describe('辞書マージ', () => {
    test('複数の辞書が正しくマージされる', async () => {
      const additionalTerm = DomainTermManager.createTerm({
        id: 'order-term',
        term: 'Order',
        definition: 'Order management functionality',
        category: 'core-business',
        importance: 'high',
        aliases: ['order'],
        examples: [{ code: 'createOrder()', description: 'Create order' }],
        relatedPatterns: ['order.*'],
        testRequirements: ['Order test']
      });

      const extraDictionary = {
        ...testDictionary,
        terms: [additionalTerm]
      };

      const merged = await versioning.mergeDictionaries(
        testDictionary,
        modifiedDictionary,
        extraDictionary
      );

      expect(merged.terms).toHaveLength(3); // Payment + User + Order
      expect(merged.terms.some(t => t.term === 'Payment')).toBe(true);
      expect(merged.terms.some(t => t.term === 'User')).toBe(true);
      expect(merged.terms.some(t => t.term === 'Order')).toBe(true);
      
      // バージョンが更新されることを確認
      expect(merged.version).not.toBe('1.0.0');
      expect(merged.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('バージョン復元', () => {
    test('指定バージョンから辞書が復元される', async () => {
      const version = await versioning.createVersion(testDictionary, 'Restore test');
      const restored = await versioning.restoreVersion(version);

      expect(restored).toBeDefined();
      expect(restored?.version).toBe('1.0.0');
      expect(restored?.terms).toHaveLength(1);
      expect(restored?.terms[0].term).toBe('Payment');
    });

    test('存在しないバージョンの復元でnullが返される', async () => {
      const result = await versioning.restoreVersion('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('履歴圧縮', () => {
    test('指定数を超えるバージョンが削除される', async () => {
      // maxVersionsを超える数のバージョンを作成
      const versions = [];
      for (let i = 0; i < 7; i++) {
        const version = await versioning.createVersion(testDictionary, `Version ${i}`);
        versions.push(version);
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      await versioning.compactHistory(3);

      const remainingVersions = await versioning.listVersions();
      expect(remainingVersions).toHaveLength(3);
      
      // 最新の3つのバージョンが残っていることを確認
      expect(remainingVersions[0].version).toBe(versions[6]); // 最新
      expect(remainingVersions[1].version).toBe(versions[5]);
      expect(remainingVersions[2].version).toBe(versions[4]);
    });

    test('保持数以下の場合は削除されない', async () => {
      await versioning.createVersion(testDictionary, 'Version 1');
      await versioning.createVersion(modifiedDictionary, 'Version 2');

      await versioning.compactHistory(5);

      const versions = await versioning.listVersions();
      expect(versions).toHaveLength(2);
    });
  });

  describe('バージョン統計', () => {
    test('統計情報が正しく取得される', async () => {
      const version1 = await versioning.createVersion(testDictionary, 'Stats test 1');
      await new Promise(resolve => setTimeout(resolve, 10));
      const version2 = await versioning.createVersion(modifiedDictionary, 'Stats test 2');

      const stats = await versioning.getVersioningStats();

      expect(stats.totalVersions).toBe(2);
      expect(stats.newestVersion).toBe(version2);
      expect(stats.oldestVersion).toBe(version1);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.averageSize).toBeGreaterThan(0);
    });

    test('バージョンが存在しない場合の統計', async () => {
      const stats = await versioning.getVersioningStats();

      expect(stats.totalVersions).toBe(0);
      expect(stats.newestVersion).toBeNull();
      expect(stats.oldestVersion).toBeNull();
      expect(stats.totalSize).toBe(0);
      expect(stats.averageSize).toBe(0);
    });
  });

  describe('古いバージョンの自動クリーンアップ', () => {
    test('バージョン作成時に自動クリーンアップが実行される', async () => {
      // maxVersions = 5 を超える数のバージョンを作成
      for (let i = 0; i < 7; i++) {
        await versioning.createVersion(testDictionary, `Auto cleanup ${i}`);
        await new Promise(resolve => setTimeout(resolve, 5));
      }

      const versions = await versioning.listVersions();
      expect(versions).toHaveLength(5); // maxVersionsに制限される
    });
  });

  describe('エラーハンドリング', () => {
    test('バージョン作成でエラーが適切に処理される', async () => {
      // 無効な辞書でエラーを発生させる
      const invalidDictionary = null as any;

      await expect(versioning.createVersion(invalidDictionary)).rejects.toThrow();
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });

    test('差分計算でエラーが適切に処理される', async () => {
      const result = await versioning.calculateDiff('invalid1', 'invalid2');
      expect(result).toBeNull();
      expect(mockErrorHandler.handleError).toHaveBeenCalled();
    });
  });
});

describe('DiffVisualizer', () => {
  let testDiff: DictionaryDiff;

  beforeEach(() => {
    const addedTerm = DomainTermManager.createTerm({
      id: 'new-term',
      term: 'NewTerm',
      definition: 'New term definition',
      category: 'technical',
      importance: 'medium',
      aliases: ['new'],
      examples: [{ code: 'newTerm()', description: 'New term example' }],
      relatedPatterns: ['new.*'],
      testRequirements: ['New term test']
    });

    const removedTerm = DomainTermManager.createTerm({
      id: 'old-term',
      term: 'OldTerm',
      definition: 'Old term definition',
      category: 'legacy',
      importance: 'low',
      aliases: ['old'],
      examples: [{ code: 'oldTerm()', description: 'Old term example' }],
      relatedPatterns: ['old.*'],
      testRequirements: ['Old term test']
    });

    const oldTerm = DomainTermManager.createTerm({
      id: 'modified-term',
      term: 'ModifiedTerm',
      definition: 'Old definition',
      category: 'technical',
      importance: 'low',
      aliases: ['modified'],
      examples: [{ code: 'oldMethod()', description: 'Old example' }],
      relatedPatterns: ['old.*'],
      testRequirements: ['Old test']
    });

    const newTerm = DomainTermManager.createTerm({
      id: 'modified-term',
      term: 'ModifiedTerm',
      definition: 'New definition',
      category: 'core-business',
      importance: 'high',
      aliases: ['modified'],
      examples: [{ code: 'newMethod()', description: 'New example' }],
      relatedPatterns: ['new.*'],
      testRequirements: ['New test']
    });

    const addedRule = BusinessRuleManager.createRule({
      id: 'new-rule',
      name: 'New Rule',
      description: 'New rule description',
      domain: 'business',
      condition: { type: 'function-name', pattern: 'new.*', scope: 'function' },
      requirements: [{ type: 'must-have', description: 'New test', testPattern: 'new.*', example: 'new test' }],
      priority: 10
    });

    testDiff = {
      added: {
        terms: [addedTerm],
        rules: [addedRule]
      },
      removed: {
        terms: [removedTerm],
        rules: []
      },
      modified: {
        terms: [{ old: oldTerm, new: newTerm }],
        rules: []
      }
    };
  });

  describe('テキスト形式差分表示', () => {
    test('差分がテキスト形式で正しく表示される', () => {
      const text = DiffVisualizer.formatDiffAsText(testDiff);

      expect(text).toContain('📚 追加された用語:');
      expect(text).toContain('+ NewTerm (technical)');
      expect(text).toContain('定義: New term definition');

      expect(text).toContain('🗑️  削除された用語:');
      expect(text).toContain('- OldTerm (legacy)');

      expect(text).toContain('📝 変更された用語:');
      expect(text).toContain('~ ModifiedTerm');
      expect(text).toContain('定義: "Old definition" → "New definition"');
      expect(text).toContain('カテゴリ: technical → core-business');
      expect(text).toContain('重要度: low → high');

      expect(text).toContain('📏 追加されたルール:');
      expect(text).toContain('+ New Rule');
      expect(text).toContain('説明: New rule description');
    });

    test('変更がない場合は空の文字列が返される', () => {
      const emptyDiff: DictionaryDiff = {
        added: { terms: [], rules: [] },
        removed: { terms: [], rules: [] },
        modified: { terms: [], rules: [] }
      };

      const text = DiffVisualizer.formatDiffAsText(emptyDiff);
      expect(text).toBe('');
    });
  });

  describe('差分統計生成', () => {
    test('差分統計が正しく計算される', () => {
      const stats = DiffVisualizer.generateDiffStats(testDiff);

      expect(stats.totalChanges).toBe(4); // 1 added + 1 removed + 1 modified terms + 1 added rule
      expect(stats.termsChanged).toBe(3); // 1 added + 1 removed + 1 modified
      expect(stats.rulesChanged).toBe(1); // 1 added
      expect(stats.additions).toBe(2); // 1 term + 1 rule
      expect(stats.deletions).toBe(1); // 1 term
      expect(stats.modifications).toBe(1); // 1 term
    });

    test('変更がない場合は全て0になる', () => {
      const emptyDiff: DictionaryDiff = {
        added: { terms: [], rules: [] },
        removed: { terms: [], rules: [] },
        modified: { terms: [], rules: [] }
      };

      const stats = DiffVisualizer.generateDiffStats(emptyDiff);

      expect(stats.totalChanges).toBe(0);
      expect(stats.termsChanged).toBe(0);
      expect(stats.rulesChanged).toBe(0);
      expect(stats.additions).toBe(0);
      expect(stats.deletions).toBe(0);
      expect(stats.modifications).toBe(0);
    });
  });
});