/**
 * InteractiveDomainValidator Test Suite
 * v0.9.0 - 対話型ドメイン検証のテスト
 * 
 * TDD: RED段階 - 失敗するテストから開始
 */

import { InteractiveDomainValidator } from '../../src/domain-analysis/InteractiveDomainValidator';
import { DomainCluster, UserValidationResult } from '../../src/domain-analysis/types';

// inquirerのモック化
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));

const inquirer = require('inquirer');
const mockedPrompt = inquirer.prompt as jest.Mock;

describe('InteractiveDomainValidator', () => {
  let validator: InteractiveDomainValidator;
  
  beforeEach(() => {
    validator = new InteractiveDomainValidator();
    jest.clearAllMocks();
  });

  describe('基本機能', () => {
    it('インスタンスを生成できる', () => {
      expect(validator).toBeDefined();
      expect(validator).toBeInstanceOf(InteractiveDomainValidator);
    });

    it('validateメソッドが存在する', () => {
      expect(validator.validate).toBeDefined();
      expect(typeof validator.validate).toBe('function');
    });
  });

  describe('ドメイン検証', () => {
    const sampleClusters: DomainCluster[] = [
      {
        id: 'cluster-1',
        name: 'User Management',
        keywords: ['user', 'auth', 'login', 'password'],
        confidence: 0.85,
        files: ['src/auth.ts', 'src/user.ts']
      },
      {
        id: 'cluster-2',
        name: 'Payment Processing',
        keywords: ['payment', 'transaction', 'billing'],
        confidence: 0.72,
        files: ['src/payment.ts', 'src/billing.ts']
      }
    ];

    it('全てのドメインを承認できる', async () => {
      // ユーザーが全て承認する場合のモック
      mockedPrompt.mockResolvedValueOnce({
        action: 'approve'
      }).mockResolvedValueOnce({
        action: 'approve'
      }).mockResolvedValueOnce({
        continue: false
      });

      const result = await validator.validate(sampleClusters);
      
      expect(result.validated).toBe(true);
      expect(result.approvedDomains).toHaveLength(2);
      expect(result.modifiedDomains).toHaveLength(0);
      expect(result.rejectedDomains).toHaveLength(0);
    });

    it('ドメインを修正できる', async () => {
      // 最初のドメインを修正する場合のモック
      mockedPrompt
        .mockResolvedValueOnce({
          action: 'modify'
        })
        .mockResolvedValueOnce({
          newName: 'Authentication & Authorization',
          newKeywords: 'auth, login, security, jwt, oauth'
        })
        .mockResolvedValueOnce({
          action: 'approve'
        })
        .mockResolvedValueOnce({
          continue: false
        });

      const result = await validator.validate(sampleClusters);
      
      expect(result.validated).toBe(true);
      expect(result.approvedDomains).toHaveLength(1);
      expect(result.modifiedDomains).toHaveLength(1);
      expect(result.modifiedDomains[0].name).toBe('Authentication & Authorization');
      expect(result.modifiedDomains[0].keywords).toContain('jwt');
      expect(result.modifiedDomains[0].keywords).toContain('oauth');
      expect(result.rejectedDomains).toHaveLength(0);
    });

    it('ドメインを拒否できる', async () => {
      // 2番目のドメインを拒否する場合のモック
      mockedPrompt
        .mockResolvedValueOnce({
          action: 'approve'
        })
        .mockResolvedValueOnce({
          action: 'reject'
        })
        .mockResolvedValueOnce({
          continue: false
        });

      const result = await validator.validate(sampleClusters);
      
      expect(result.validated).toBe(true);
      expect(result.approvedDomains).toHaveLength(1);
      expect(result.modifiedDomains).toHaveLength(0);
      expect(result.rejectedDomains).toHaveLength(1);
      expect(result.rejectedDomains[0].id).toBe('cluster-2');
    });

    it('空のクラスタリストを処理できる', async () => {
      const result = await validator.validate([]);
      
      expect(result.validated).toBe(true);
      expect(result.approvedDomains).toHaveLength(0);
      expect(result.modifiedDomains).toHaveLength(0);
      expect(result.rejectedDomains).toHaveLength(0);
    });

    it('新しいドメインを追加できる', async () => {
      // 既存ドメインを承認後、新しいドメインを追加
      mockedPrompt
        .mockResolvedValueOnce({
          action: 'approve'
        })
        .mockResolvedValueOnce({
          action: 'approve'
        })
        .mockResolvedValueOnce({
          continue: true
        })
        .mockResolvedValueOnce({
          name: 'Logging & Monitoring',
          keywords: 'log, monitor, metrics, trace, debug'
        })
        .mockResolvedValueOnce({
          continue: false
        });

      const result = await validator.validate(sampleClusters);
      
      expect(result.validated).toBe(true);
      expect(result.approvedDomains).toHaveLength(3);
      const newDomain = result.approvedDomains.find(d => d.name === 'Logging & Monitoring');
      expect(newDomain).toBeDefined();
      expect(newDomain?.keywords).toContain('metrics');
    });
  });

  describe('エラーハンドリング', () => {
    it('不正な入力を処理できる', async () => {
      // null/undefinedを渡した場合
      const result = await validator.validate(null as any);
      
      expect(result.validated).toBe(false);
      expect(result.approvedDomains).toHaveLength(0);
      expect(result.modifiedDomains).toHaveLength(0);
      expect(result.rejectedDomains).toHaveLength(0);
    });

    it('inquirerエラーを処理できる', async () => {
      mockedPrompt.mockRejectedValueOnce(new Error('User cancelled'));

      const result = await validator.validate([
        {
          id: 'test',
          name: 'Test',
          keywords: ['test'],
          confidence: 0.5,
          files: []
        }
      ]);
      
      expect(result.validated).toBe(false);
    });
  });

  describe('表示機能', () => {
    it('クラスタ情報を見やすく表示できる', () => {
      const cluster: DomainCluster = {
        id: 'test-cluster',
        name: 'Test Domain',
        keywords: ['test', 'spec', 'unit'],
        confidence: 0.95,
        files: ['test/a.ts', 'test/b.ts', 'test/c.ts']
      };

      const formatted = validator.formatClusterDisplay(cluster);
      
      expect(formatted).toContain('Test Domain');
      expect(formatted).toContain('95%');
      expect(formatted).toContain('test, spec, unit');
      expect(formatted).toContain('3 files');
    });

    it('信頼度に応じて適切な色を選択できる', () => {
      expect(validator.getConfidenceColor(0.9)).toBe('green');
      expect(validator.getConfidenceColor(0.7)).toBe('yellow');
      expect(validator.getConfidenceColor(0.5)).toBe('red');
    });
  });

  describe('バリデーション', () => {
    it('ドメイン名の妥当性を検証できる', () => {
      expect(validator.isValidDomainName('User Management')).toBe(true);
      expect(validator.isValidDomainName('')).toBe(false);
      expect(validator.isValidDomainName('a')).toBe(false); // 短すぎる
      expect(validator.isValidDomainName('a'.repeat(100))).toBe(false); // 長すぎる
    });

    it('キーワードリストの妥当性を検証できる', () => {
      expect(validator.isValidKeywords(['user', 'auth'])).toBe(true);
      expect(validator.isValidKeywords([])).toBe(false);
      expect(validator.isValidKeywords([''])).toBe(false);
      expect(validator.isValidKeywords(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'])).toBe(false); // 多すぎる
    });
  });

  describe('KISS原則とYAGNI原則', () => {
    it('シンプルなインターフェースを提供する', () => {
      // validateメソッドは1つの引数のみ
      expect(validator.validate.length).toBeLessThanOrEqual(2);
    });

    it('必要最小限のオプションのみを提供する', () => {
      const config = {
        skipConfirmation: true
      };
      const validatorWithConfig = new InteractiveDomainValidator(config);
      expect(validatorWithConfig).toBeDefined();
    });
  });

  describe('Defensive Programming', () => {
    it('不正な信頼度値を処理できる', () => {
      const cluster: DomainCluster = {
        id: 'test',
        name: 'Test',
        keywords: ['test'],
        confidence: NaN,
        files: []
      };

      const formatted = validator.formatClusterDisplay(cluster);
      expect(formatted).toContain('N/A');
    });

    it('循環参照を含むオブジェクトを処理できる', () => {
      const cluster: any = {
        id: 'test',
        name: 'Test',
        keywords: ['test'],
        confidence: 0.5,
        files: []
      };
      cluster.self = cluster; // 循環参照

      expect(() => validator.validate([cluster])).not.toThrow();
    });
  });
});