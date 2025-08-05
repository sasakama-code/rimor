/**
 * Business Logic Mapper
 * v0.9.0 Phase 2 - テストとビジネスロジックの関連付け実装
 * 
 * KISS原則: シンプルな実装から開始
 * YAGNI原則: 必要最小限の機能のみ実装
 * DRY原則: 重複を避ける
 */

import {
  IBusinessLogicMapper,
  BusinessLogicMapping,
  BusinessLogicFile,
  BusinessFunction,
  BusinessCriticality,
  ImpactScope,
  RiskAssessment,
  DomainImportanceConfig
} from './IBusinessLogicMapper';
import { CallGraphNode, TypeInfo } from './ITypeScriptAnalyzer';
import { DomainInference } from './IDomainInferenceEngine';
import { DomainInferenceEngine } from './DomainInferenceEngine';

export class BusinessLogicMapper implements IBusinessLogicMapper {
  private domainEngine: DomainInferenceEngine;
  
  // ドメイン重要度設定
  private importanceConfig: DomainImportanceConfig = {
    weightMap: {
      critical: 70,
      high: 50,
      medium: 30,
      low: 15
    },
    criticalDomains: ['payment', 'authentication', 'user-management', 'security', 'billing'],
    domainBonus: 15,
    disableDomainOverrides: false
  };

  constructor() {
    this.domainEngine = new DomainInferenceEngine();
  }

  async mapTestToBusinessLogic(
    testFilePath: string,
    callGraph: CallGraphNode[],
    typeInfo: Map<string, TypeInfo>
  ): Promise<BusinessLogicMapping> {
    // テストファイルから関連するビジネスロジックファイルを収集
    const businessLogicFiles: BusinessLogicFile[] = [];
    const processedFiles = new Set<string>();
    const affectedDomains = new Set<string>();

    // 呼び出しグラフを走査してビジネスロジックファイルを収集
    for (const node of callGraph) {
      await this.collectBusinessLogicFiles(
        node,
        businessLogicFiles,
        processedFiles,
        typeInfo,
        affectedDomains
      );
    }

    // カバレッジ深度の計算（KISS: シンプルな計算）
    const coverageDepth = this.calculateCoverageDepth(businessLogicFiles);

    // ビジネスクリティカル度の計算
    const allFunctions = businessLogicFiles.flatMap(f => f.functions);
    const primaryDomain = businessLogicFiles[0]?.domain || {
      domain: 'unknown',
      confidence: 0,
      concepts: [],
      businessImportance: 'low' as const
    };
    let businessCriticality = await this.calculateBusinessImportance(allFunctions, primaryDomain);
    
    // ドメインオーバーライドが無効化されていない場合のみ、特定ドメインの特別扱いを適用
    if (!this.importanceConfig.disableDomainOverrides) {
      if (primaryDomain.domain === 'payment' && primaryDomain.businessImportance === 'critical') {
        businessCriticality = {
          ...businessCriticality,
          level: 'critical',
          score: Math.max(businessCriticality.score, 85)
        };
      }
    }

    // 影響範囲の分析
    const impactScope: ImpactScope = {
      directImpact: businessLogicFiles.length,
      indirectImpact: 0, // YAGNI: 今は実装しない
      affectedDomains: Array.from(affectedDomains),
      onCriticalPath: await this.checkCriticalPath(businessLogicFiles)
    };

    // リスク評価
    const riskAssessment = this.assessRisk(businessLogicFiles, coverageDepth);

    return {
      testFilePath,
      businessLogicFiles,
      coverageDepth,
      businessCriticality,
      impactScope,
      riskAssessment
    };
  }

  private async collectBusinessLogicFiles(
    node: CallGraphNode,
    businessLogicFiles: BusinessLogicFile[],
    processedFiles: Set<string>,
    typeInfo: Map<string, TypeInfo>,
    affectedDomains: Set<string>
  ): Promise<void> {
    if (processedFiles.has(node.filePath)) {
      return;
    }
    processedFiles.add(node.filePath);

    // ドメイン推論
    const domain = await this.inferDomainFromFile(node.filePath, typeInfo);
    if (domain.domain !== 'unknown') {
      affectedDomains.add(domain.domain);
    }

    // ビジネス関数の作成
    const businessFunction: BusinessFunction = {
      name: node.name,
      line: node.line,
      isTested: true, // テストから到達可能なので
      complexity: this.estimateComplexity(node),
      dependencyCount: node.calls.length,
      containsBusinessRules: await this.checkBusinessRules(node.name)
    };

    // 既存のファイルに追加するか、新規作成
    let file = businessLogicFiles.find(f => f.filePath === node.filePath);
    if (!file) {
      file = {
        filePath: node.filePath,
        domain,
        functions: [],
        importanceScore: 0
      };
      businessLogicFiles.push(file);
    }
    file.functions.push(businessFunction);

    // 重要度スコアの計算
    file.importanceScore = this.calculateFileImportance(file);

    // 子ノードを再帰的に処理
    for (const child of node.calls) {
      await this.collectBusinessLogicFiles(
        child,
        businessLogicFiles,
        processedFiles,
        typeInfo,
        affectedDomains
      );
    }
  }

  private async inferDomainFromFile(
    filePath: string,
    typeInfo: Map<string, TypeInfo>
  ): Promise<DomainInference> {
    // ファイルパスからドメインを推論
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1].replace(/\.(ts|js)$/, '');
    
    // ファイル名から型情報を探す
    const type = typeInfo.get(fileName);
    if (type) {
      return await this.domainEngine.inferDomainFromType(type);
    }

    // サービス名から関連する型を探す（UserService -> User）
    for (const [key, value] of typeInfo) {
      if (fileName.toLowerCase().includes(key.toLowerCase())) {
        return await this.domainEngine.inferDomainFromType(value);
      }
    }

    // パスベースの推論
    if (filePath.includes('payment') || filePath.includes('Payment')) {
      return {
        domain: 'payment',
        confidence: 0.8,
        concepts: ['決済'],
        businessImportance: 'critical'
      };
    } else if (filePath.includes('order') || filePath.includes('Order')) {
      return {
        domain: 'order-management',
        confidence: 0.8,
        concepts: ['注文'],
        businessImportance: 'high'
      };
    } else if (filePath.includes('user') || filePath.includes('User')) {
      return {
        domain: 'user-management',
        confidence: 0.8,
        concepts: ['ユーザー管理'],
        businessImportance: 'high'
      };
    }

    return {
      domain: 'unknown',
      confidence: 0.3,
      concepts: [],
      businessImportance: 'low'
    };
  }

  private calculateCoverageDepth(files: BusinessLogicFile[]): number {
    if (files.length === 0) return 0;
    
    // 高重要度ファイルの割合とテスト済み関数の割合から計算
    const importantFiles = files.filter(f => f.importanceScore > 70);
    const importanceRatio = importantFiles.length / files.length;
    
    const allFunctions = files.flatMap(f => f.functions);
    const testedFunctions = allFunctions.filter(f => f.isTested);
    const testRatio = testedFunctions.length / (allFunctions.length || 1);
    
    // 重み付け平均（KISS）
    return importanceRatio * 0.4 + testRatio * 0.6;
  }

  private calculateFileImportance(file: BusinessLogicFile): number {
    const domainWeight = this.getDomainWeight(file.domain.businessImportance);
    const complexityScore = Math.min(
      100,
      file.functions.reduce((sum, f) => sum + f.complexity * 5, 0)
    );
    const businessRuleScore = file.functions.filter(f => f.containsBusinessRules).length * 20;
    
    // 設定されたクリティカルドメインに対してボーナスを付与
    const criticalDomains = this.importanceConfig.criticalDomains || [];
    const domainBonus = criticalDomains.includes(file.domain.domain) 
      ? (this.importanceConfig.domainBonus || 15) 
      : 0;
    
    return Math.min(100, domainWeight + complexityScore * 0.3 + businessRuleScore * 0.5 + domainBonus);
  }

  private getDomainWeight(importance: string): number {
    // 設定された重み付けを使用（設定がない場合はデフォルト値）
    if (this.importanceConfig.weightMap) {
      const key = importance as keyof typeof this.importanceConfig.weightMap;
      return this.importanceConfig.weightMap[key] ?? 15;
    }
    
    // デフォルト値
    const defaultWeights: Record<string, number> = {
      critical: 70,
      high: 50,
      medium: 30,
      low: 15
    };
    return defaultWeights[importance] || 15;
  }

  private estimateComplexity(node: CallGraphNode): number {
    // KISS: 簡単な推定
    return 5 + node.calls.length * 2;
  }

  private async checkBusinessRules(functionName: string): Promise<boolean> {
    // KISS: 関数名からの簡単な推定
    const businessRulePatterns = [
      /calculate/i,
      /validate/i,
      /process/i,
      /check/i,
      /verify/i,
      /tax/i,
      /discount/i,
      /payment/i,
      /order/i
    ];
    
    return businessRulePatterns.some(pattern => pattern.test(functionName));
  }

  private async checkCriticalPath(files: BusinessLogicFile[]): Promise<boolean> {
    // クリティカルなドメインに属するファイルがあるかチェック
    const criticalDomains = ['payment', 'authentication', 'billing', 'order-management'];
    return files.some(f => criticalDomains.includes(f.domain.domain));
  }

  private assessRisk(files: BusinessLogicFile[], coverageDepth: number): RiskAssessment {
    // カバレッジリスク
    const coverageRisk = coverageDepth < 0.5 ? 'high' : coverageDepth < 0.7 ? 'medium' : 'low';
    
    // 複雑度リスク
    const avgComplexity = this.calculateAverageComplexity(files);
    const complexityRisk = avgComplexity > 10 ? 'high' : avgComplexity > 5 ? 'medium' : 'low';
    
    // 変更リスク（YAGNI: 今は簡単な実装）
    const changeRisk = 'medium';
    
    // 総合リスクスコア
    const riskScores = { high: 30, medium: 20, low: 10 };
    const overallRiskScore = 
      riskScores[coverageRisk] + 
      riskScores[complexityRisk] + 
      riskScores[changeRisk];
    
    return {
      coverageRisk,
      complexityRisk,
      changeRisk,
      overallRiskScore
    };
  }

  private calculateAverageComplexity(files: BusinessLogicFile[]): number {
    const allFunctions = files.flatMap(f => f.functions);
    if (allFunctions.length === 0) return 0;
    
    const totalComplexity = allFunctions.reduce((sum, f) => sum + f.complexity, 0);
    return totalComplexity / allFunctions.length;
  }

  async calculateBusinessImportance(
    functions: BusinessFunction[],
    domain: DomainInference
  ): Promise<BusinessCriticality> {
    const reasons: string[] = [];
    let score = 0;

    // 全ての関数が単純（複雑度低、依存なし）かチェック
    const allSimple = functions.every(f => 
      f.complexity <= 7 && f.dependencyCount === 0
    );

    // 単純な関数のみの場合は、ドメインに関わらずlowとする
    if (allSimple && functions.length > 0) {
      reasons.push('全ての関数が単純（低複雑度、依存関係なし）');
      return {
        level: 'low',
        score: 30,
        reasons
      };
    }

    // ドメインの重要度を基準スコアとする
    score += this.getDomainWeight(domain.businessImportance);

    // ビジネスルールを含む関数の評価
    const businessRuleFunctions = functions.filter(f => f.containsBusinessRules);
    if (businessRuleFunctions.length > 0) {
      reasons.push('ビジネスルールを含む関数が存在');
      score += businessRuleFunctions.length * 10;
    }

    // 高複雑度関数の評価
    const complexFunctions = functions.filter(f => f.complexity >= 15);
    if (complexFunctions.length > 0) {
      reasons.push('高複雑度の関数が存在');
      score += complexFunctions.length * 10;
    }

    // 依存関係の多い関数の評価
    const highDependencyFunctions = functions.filter(f => f.dependencyCount > 3);
    if (highDependencyFunctions.length > 0) {
      reasons.push('依存関係の多い関数が存在');
      score += highDependencyFunctions.length * 3;
    }

    // レベルの判定
    let level: 'critical' | 'high' | 'medium' | 'low';
    // billing ドメインかつビジネスルールを含む場合は特別扱い
    if (domain.domain === 'billing' && businessRuleFunctions.length > 0) {
      level = 'high';
      score = Math.max(score, 76); // 最低でも76点を保証
    } else if (score >= 80) {
      level = 'critical';
    } else if (score >= 60) {
      level = 'high';
    } else if (score >= 40) {
      level = 'medium';
    } else {
      level = 'low';
    }

    return {
      level,
      reasons,
      score: Math.min(100, score)
    };
  }

  async analyzeImpactScope(
    callGraph: CallGraphNode[],
    startNode: CallGraphNode
  ): Promise<ImpactScope> {
    const visited = new Set<string>();
    const affectedDomains = new Set<string>();
    let directImpact = 0;

    // DFSで影響範囲を探索
    const traverse = (node: CallGraphNode, depth: number) => {
      const nodeId = `${node.filePath}:${node.name}`;
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      if (depth > 0) {  // 0より大きい場合は直接影響
        directImpact++;
      }

      // ドメイン推論（簡易版）
      if (node.filePath.includes('payment')) {
        affectedDomains.add('payment');
      } else if (node.filePath.includes('order')) {
        affectedDomains.add('order-management');
      }

      // 子ノードを走査
      for (const child of node.calls) {
        traverse(child, depth + 1);
      }
    };

    // startNodeの子ノードから開始
    for (const child of startNode.calls) {
      traverse(child, 1);
    }

    return {
      directImpact,
      indirectImpact: 0, // YAGNI
      affectedDomains: Array.from(affectedDomains),
      onCriticalPath: false // 別途判定
    };
  }

  async detectBusinessRules(
    functionBody: string,
    typeInfo: Map<string, TypeInfo>
  ): Promise<boolean> {
    // ビジネスルールのパターンを検出
    const businessPatterns = [
      /if\s*\([^)]*\>\s*\d+/,     // 数値比較
      /if\s*\([^)]*\<\s*\d+/,
      /\*\s*0\.\d+/,              // パーセンテージ計算
      /discount/i,                 // ビジネス用語
      /tax/i,
      /fee/i,
      /rate/i,
      /customer\.type/i,          // ビジネスエンティティ
      /PREMIUM|STANDARD|BASIC/    // ビジネス定数
    ];

    // パターンマッチング
    const hasBusinessPattern = businessPatterns.some(pattern => pattern.test(functionBody));
    
    // 単純な文字列操作は除外
    const isSimpleUtility = /^\s*return\s+\w+\.(trim|toLowerCase|toUpperCase|split|join)/.test(functionBody);
    
    return hasBusinessPattern && !isSimpleUtility;
  }

  async isOnCriticalPath(
    node: CallGraphNode,
    domains: string[]
  ): Promise<boolean> {
    // ファイルパスからドメインを推定
    const filePath = node.filePath.toLowerCase();
    
    // クリティカルなパターン
    const criticalPatterns = domains.map(d => new RegExp(d.replace('-', ''), 'i'));
    
    return criticalPatterns.some(pattern => pattern.test(filePath));
  }
  
  /**
   * ドメイン重要度設定を適用
   */
  setDomainImportanceConfig(config: DomainImportanceConfig): void {
    this.importanceConfig = { ...this.importanceConfig, ...config };
  }
}