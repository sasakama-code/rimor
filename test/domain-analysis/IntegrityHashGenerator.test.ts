/**
 * IntegrityHashGenerator Test Suite
 * v0.9.0 - 整合性ハッシュ生成のテスト
 * 
 * TDD: RED段階 - 失敗するテストから開始
 */

import { IntegrityHashGenerator } from '../../src/domain-analysis/IntegrityHashGenerator';
import { DomainDefinition, DomainCluster, IntegrityHash } from '../../src/domain-analysis/types';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('IntegrityHashGenerator', () => {
  let generator: IntegrityHashGenerator;
  
  beforeEach(() => {
    generator = new IntegrityHashGenerator();
    jest.clearAllMocks();
  });

  describe('基本機能', () => {
    it('インスタンスを生成できる', () => {
      expect(generator).toBeDefined();
      expect(generator).toBeInstanceOf(IntegrityHashGenerator);
    });

    it('generateHashメソッドが存在する', () => {
      expect(generator.generateHash).toBeDefined();
      expect(typeof generator.generateHash).toBe('function');
    });

    it('verifyHashメソッドが存在する', () => {
      expect(generator.verifyHash).toBeDefined();
      expect(typeof generator.verifyHash).toBe('function');
    });
  });

  describe('ハッシュ生成', () => {
    const sampleDomainDefinition: DomainDefinition = {
      version: '1.0.0',
      project: {
        name: 'test-project',
        path: '/path/to/project',
        analyzed: new Date('2024-01-01T00:00:00Z')
      },
      domains: [
        {
          id: 'domain-1',
          name: 'User Management',
          keywords: ['user', 'auth', 'login'],
          confidence: 0.85,
          files: ['src/auth.ts', 'src/user.ts']
        },
        {
          id: 'domain-2',
          name: 'Payment Processing',
          keywords: ['payment', 'transaction'],
          confidence: 0.72,
          files: ['src/payment.ts']
        }
      ],
      integrity: {
        hash: '',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        version: '1.0.0'
      }
    };

    it('ドメイン定義からハッシュを生成できる', () => {
      const hash = generator.generateHash(sampleDomainDefinition);
      
      expect(hash).toBeDefined();
      expect(hash.hash).toBeDefined();
      expect(typeof hash.hash).toBe('string');
      expect(hash.hash.length).toBe(64); // SHA-256は64文字の16進数
      expect(hash.timestamp).toBeInstanceOf(Date);
      expect(hash.version).toBe('1.0.0');
    });

    it('同じ内容に対して常に同じハッシュを生成する（決定論的）', () => {
      const hash1 = generator.generateHash(sampleDomainDefinition);
      const hash2 = generator.generateHash(sampleDomainDefinition);
      
      expect(hash1.hash).toBe(hash2.hash);
    });

    it('異なる内容に対して異なるハッシュを生成する', () => {
      const modifiedDefinition = {
        ...sampleDomainDefinition,
        domains: [
          ...sampleDomainDefinition.domains,
          {
            id: 'domain-3',
            name: 'New Domain',
            keywords: ['new'],
            confidence: 0.5,
            files: []
          }
        ]
      };

      const hash1 = generator.generateHash(sampleDomainDefinition);
      const hash2 = generator.generateHash(modifiedDefinition);
      
      expect(hash1.hash).not.toBe(hash2.hash);
    });

    it('integrityフィールドを除外してハッシュを生成する', () => {
      const definitionWithHash = {
        ...sampleDomainDefinition,
        integrity: {
          hash: 'existing-hash-value',
          timestamp: new Date(),
          version: '1.0.0'
        }
      };

      const definitionWithoutHash = {
        ...sampleDomainDefinition,
        integrity: {
          hash: '',
          timestamp: new Date('2000-01-01'),
          version: '1.0.0'
        }
      };

      const hash1 = generator.generateHash(definitionWithHash);
      const hash2 = generator.generateHash(definitionWithoutHash);
      
      // integrityフィールドの内容に関わらず同じハッシュになるべき
      expect(hash1.hash).toBe(hash2.hash);
    });

    it('日付を正規化してハッシュを生成する', () => {
      const definition1 = {
        ...sampleDomainDefinition,
        project: {
          ...sampleDomainDefinition.project,
          analyzed: new Date('2024-01-01T00:00:00Z')
        }
      };

      const definition2 = {
        ...sampleDomainDefinition,
        project: {
          ...sampleDomainDefinition.project,
          analyzed: new Date('2024-01-01T00:00:00.000Z')
        }
      };

      const hash1 = generator.generateHash(definition1);
      const hash2 = generator.generateHash(definition2);
      
      expect(hash1.hash).toBe(hash2.hash);
    });

    it('配列の順序を考慮してハッシュを生成する', () => {
      const definition1 = {
        ...sampleDomainDefinition,
        domains: [
          sampleDomainDefinition.domains[0],
          sampleDomainDefinition.domains[1]
        ]
      };

      const definition2 = {
        ...sampleDomainDefinition,
        domains: [
          sampleDomainDefinition.domains[1],
          sampleDomainDefinition.domains[0]
        ]
      };

      const hash1 = generator.generateHash(definition1);
      const hash2 = generator.generateHash(definition2);
      
      // 配列の順序が異なるので異なるハッシュになるべき
      expect(hash1.hash).not.toBe(hash2.hash);
    });
  });

  describe('ハッシュ検証', () => {
    const sampleDefinition: DomainDefinition = {
      version: '1.0.0',
      project: {
        name: 'test-project',
        path: '/path/to/project',
        analyzed: new Date('2024-01-01T00:00:00Z')
      },
      domains: [
        {
          id: 'domain-1',
          name: 'User Management',
          keywords: ['user', 'auth'],
          confidence: 0.85,
          files: ['src/auth.ts']
        }
      ],
      integrity: {
        hash: '',
        timestamp: new Date(),
        version: '1.0.0'
      }
    };

    it('正しいハッシュを検証できる', () => {
      const hash = generator.generateHash(sampleDefinition);
      const definitionWithHash = {
        ...sampleDefinition,
        integrity: hash
      };

      const isValid = generator.verifyHash(definitionWithHash);
      expect(isValid).toBe(true);
    });

    it('改ざんされたデータを検出できる', () => {
      const hash = generator.generateHash(sampleDefinition);
      const definitionWithHash = {
        ...sampleDefinition,
        integrity: hash
      };

      // データを改ざん
      definitionWithHash.domains[0].name = 'Modified Name';

      const isValid = generator.verifyHash(definitionWithHash);
      expect(isValid).toBe(false);
    });

    it('不正なハッシュを検出できる', () => {
      const definitionWithBadHash = {
        ...sampleDefinition,
        integrity: {
          hash: 'invalid-hash-value',
          timestamp: new Date(),
          version: '1.0.0'
        }
      };

      const isValid = generator.verifyHash(definitionWithBadHash);
      expect(isValid).toBe(false);
    });

    it('ハッシュが存在しない場合はfalseを返す', () => {
      const definitionWithoutHash = {
        ...sampleDefinition,
        integrity: undefined as any
      };

      const isValid = generator.verifyHash(definitionWithoutHash);
      expect(isValid).toBe(false);
    });
  });

  describe('ファイル操作', () => {
    const testDir = path.join(process.cwd(), '.rimor-test');
    const testFile = path.join(testDir, 'domain.json');

    beforeEach(async () => {
      // テスト用ディレクトリを作成
      try {
        await fs.mkdir(testDir, { recursive: true });
      } catch (error) {
        // ディレクトリが既に存在する場合は無視
      }
    });

    afterEach(async () => {
      // テスト用ディレクトリをクリーンアップ
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch (error) {
        // エラーは無視
      }
    });

    it('ドメイン定義をファイルに保存できる', async () => {
      const definition: DomainDefinition = {
        version: '1.0.0',
        project: {
          name: 'test-project',
          path: '/path/to/project',
          analyzed: new Date('2024-01-01T00:00:00Z')
        },
        domains: [
          {
            id: 'domain-1',
            name: 'Test Domain',
            keywords: ['test'],
            confidence: 0.9,
            files: ['test.ts']
          }
        ],
        integrity: {
          hash: '',
          timestamp: new Date(),
          version: '1.0.0'
        }
      };

      await generator.saveWithIntegrity(definition, testFile);

      // ファイルが存在することを確認
      const fileExists = await fs.access(testFile).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // ファイル内容を読み取り
      const content = await fs.readFile(testFile, 'utf-8');
      const savedDefinition = JSON.parse(content);

      // ハッシュが生成されていることを確認
      expect(savedDefinition.integrity.hash).toBeDefined();
      expect(savedDefinition.integrity.hash.length).toBe(64);
    });

    it('ファイルから読み込んで検証できる', async () => {
      const definition: DomainDefinition = {
        version: '1.0.0',
        project: {
          name: 'test-project',
          path: '/path/to/project',
          analyzed: new Date('2024-01-01T00:00:00Z')
        },
        domains: [
          {
            id: 'domain-1',
            name: 'Test Domain',
            keywords: ['test'],
            confidence: 0.9,
            files: ['test.ts']
          }
        ],
        integrity: {
          hash: '',
          timestamp: new Date(),
          version: '1.0.0'
        }
      };

      // ファイルに保存
      await generator.saveWithIntegrity(definition, testFile);

      // ファイルから読み込んで検証
      const result = await generator.loadAndVerify(testFile);

      expect(result.valid).toBe(true);
      expect(result.definition).toBeDefined();
      expect(result.definition?.domains[0].name).toBe('Test Domain');
    });

    it('改ざんされたファイルを検出できる', async () => {
      const definition: DomainDefinition = {
        version: '1.0.0',
        project: {
          name: 'test-project',
          path: '/path/to/project',
          analyzed: new Date('2024-01-01T00:00:00Z')
        },
        domains: [
          {
            id: 'domain-1',
            name: 'Test Domain',
            keywords: ['test'],
            confidence: 0.9,
            files: ['test.ts']
          }
        ],
        integrity: {
          hash: '',
          timestamp: new Date(),
          version: '1.0.0'
        }
      };

      // ファイルに保存
      await generator.saveWithIntegrity(definition, testFile);

      // ファイルを改ざん
      const content = await fs.readFile(testFile, 'utf-8');
      const tampered = JSON.parse(content);
      tampered.domains[0].name = 'Tampered Domain';
      await fs.writeFile(testFile, JSON.stringify(tampered, null, 2));

      // 検証
      const result = await generator.loadAndVerify(testFile);

      expect(result.valid).toBe(false);
      expect(result.definition).toBeNull();
      expect(result.error).toContain('改ざん');
    });

    it('存在しないファイルを処理できる', async () => {
      const result = await generator.loadAndVerify('/non/existent/file.json');

      expect(result.valid).toBe(false);
      expect(result.definition).toBeNull();
      expect(result.error).toContain('ファイルが見つかりません');
    });
  });

  describe('KISS原則とYAGNI原則', () => {
    it('シンプルなインターフェースを提供する', () => {
      // 主要メソッドは2つのみ
      expect(generator.generateHash).toBeDefined();
      expect(generator.verifyHash).toBeDefined();
      
      // メソッドの引数は最小限
      expect(generator.generateHash.length).toBe(1);
      expect(generator.verifyHash.length).toBe(1);
    });
  });

  describe('Defensive Programming', () => {
    it('nullやundefinedを処理できる', () => {
      expect(() => generator.generateHash(null as any)).not.toThrow();
      expect(() => generator.generateHash(undefined as any)).not.toThrow();
      expect(() => generator.verifyHash(null as any)).not.toThrow();
      expect(() => generator.verifyHash(undefined as any)).not.toThrow();
    });

    it('循環参照を含むオブジェクトを処理できる', () => {
      const definition: any = {
        version: '1.0.0',
        project: {
          name: 'test',
          path: '/test',
          analyzed: new Date()
        },
        domains: []
      };
      
      // 循環参照を作成
      definition.self = definition;

      expect(() => generator.generateHash(definition)).not.toThrow();
    });

    it('大きなデータセットを処理できる', () => {
      const largeDefinition: DomainDefinition = {
        version: '1.0.0',
        project: {
          name: 'large-project',
          path: '/path',
          analyzed: new Date()
        },
        domains: Array.from({ length: 1000 }, (_, i) => ({
          id: `domain-${i}`,
          name: `Domain ${i}`,
          keywords: Array.from({ length: 100 }, (_, j) => `keyword-${i}-${j}`),
          confidence: Math.random(),
          files: Array.from({ length: 50 }, (_, k) => `file-${i}-${k}.ts`)
        })),
        integrity: {
          hash: '',
          timestamp: new Date(),
          version: '1.0.0'
        }
      };

      expect(() => {
        const hash = generator.generateHash(largeDefinition);
        expect(hash.hash).toBeDefined();
      }).not.toThrow();
    });
  });
});