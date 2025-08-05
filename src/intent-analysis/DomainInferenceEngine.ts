/**
 * Domain Inference Engine
 * v0.9.0 Phase 2 - 型名からドメイン概念を推論する実装
 * 
 * KISS原則: シンプルなパターンマッチングから開始
 * YAGNI原則: 必要最小限の機能のみ実装
 */

import { 
  IDomainInferenceEngine, 
  DomainInference, 
  DomainContext,
  BusinessImportance,
  DomainDictionary,
  ConfidenceConfig
} from './IDomainInferenceEngine';
import { TypeInfo } from './ITypeScriptAnalyzer';

export class DomainInferenceEngine implements IDomainInferenceEngine {
  // ドメイン辞書（シンプルなマップとして実装）
  private domainDictionary: DomainDictionary = {
    terms: [],
    rules: []
  };
  
  // 信頼度設定
  private confidenceConfig: ConfidenceConfig = {
    defaultConfidence: 0.5,
    evidenceBoostFactor: 0.1
  };

  // 組み込みのドメインパターン（設定可能な信頼度を持つ）
  private builtInPatterns = new Map<string, { domain: string; confidence: number; concepts: string[]; importance: BusinessImportance }>([
    ['User', { domain: 'user-management', confidence: 0.7, concepts: ['ユーザー', '認証', 'アカウント管理'], importance: 'high' }],
    ['PaymentService', { domain: 'payment', confidence: 0.75, concepts: ['決済', '支払い', 'トランザクション'], importance: 'high' }],
    ['Order', { domain: 'order-management', confidence: 0.65, concepts: ['注文'], importance: 'high' }],
    ['AuthenticationService', { domain: 'authentication', confidence: 0.75, concepts: ['認証', 'アクセス制御', 'セキュリティ'], importance: 'high' }],
    ['Invoice', { domain: 'billing', confidence: 0.7, concepts: ['請求', '課金'], importance: 'high' }],
    ['InvoiceProcessor', { domain: 'billing', confidence: 0.7, concepts: ['請求', '課金', '会計', '税務'], importance: 'high' }]
  ]);

  // ドメイン重要度マップ（控えめなデフォルト値）
  private readonly domainImportanceMap = new Map<string, BusinessImportance>([
    ['payment', 'high'],
    ['authentication', 'high'],
    ['billing', 'high'],
    ['user-management', 'high'],
    ['order-management', 'high'],
    ['logging', 'medium'],
    ['utility', 'low'],
    ['general', 'low']
  ]);

  async inferDomainFromType(typeInfo: TypeInfo): Promise<DomainInference> {
    // プリミティブ型の場合
    if (typeInfo.isPrimitive) {
      return {
        domain: 'general',
        confidence: 0.1,
        concepts: [],
        businessImportance: 'low'
      };
    }

    // ジェネリック型の場合、型引数も考慮
    if (typeInfo.typeArguments && typeInfo.typeArguments.length > 0) {
      const baseType = this.builtInPatterns.get(typeInfo.typeName);
      const argType = typeInfo.typeArguments[0];
      const argPattern = this.builtInPatterns.get(argType.typeName);

      if (typeInfo.typeName === 'Repository' && argPattern) {
        return {
          domain: argPattern.domain,
          confidence: Math.min(0.8, argPattern.confidence + 0.1),  // 複合証拠によるわずかな増加
          concepts: [...argPattern.concepts, 'リポジトリ', 'データアクセス'],
          businessImportance: argPattern.importance
        };
      }
    }

    // 組み込みパターンから検索
    const pattern = this.builtInPatterns.get(typeInfo.typeName);
    if (pattern) {
      return {
        domain: pattern.domain,
        confidence: this.getConfidence(typeInfo.typeName, pattern.confidence),
        concepts: pattern.concepts,
        businessImportance: pattern.importance
      };
    }

    // 辞書から検索（YAGNI: 今は基本的な実装のみ）
    const dictEntry = this.domainDictionary.terms.find(t => t.term === typeInfo.typeName);
    if (dictEntry) {
      const importance = await this.getDomainImportance(dictEntry.domain);
      return {
        domain: dictEntry.domain,
        confidence: dictEntry.weight,
        concepts: this.inferConceptsFromDomain(dictEntry.domain),
        businessImportance: importance
      };
    }

    // ルールベースのマッチング
    let bestMatch: DomainInference | null = null;
    let maxConfidence = 0;
    
    for (const rule of this.domainDictionary.rules) {
      if (rule.pattern.test(typeInfo.typeName)) {
        const importance = await this.getDomainImportance(rule.domain);
        const concepts = this.inferConceptsFromDomain(rule.domain);
        
        // Service系の場合は追加の概念を付与
        if (typeInfo.typeName.endsWith('Service')) {
          concepts.push('サービス層');
        }
        
        // 複合的な名前の場合（例：UserService）、複数のパターンを考慮
        let combinedConfidence = rule.weight;
        const baseConcepts: string[] = [];
        
        // 複合名の各部分をチェック
        for (const [name, pattern] of this.builtInPatterns) {
          if (typeInfo.typeName.includes(name) && name !== typeInfo.typeName) {
            combinedConfidence = Math.min(1.0, combinedConfidence + pattern.confidence * 0.3);
            baseConcepts.push(...pattern.concepts);
          }
        }
        
        // 辞書の用語も考慮
        for (const term of this.domainDictionary.terms) {
          if (typeInfo.typeName.includes(term.term) && term.term !== typeInfo.typeName) {
            combinedConfidence = Math.min(1.0, combinedConfidence + term.weight * 0.3);
            baseConcepts.push(...this.inferConceptsFromDomain(term.domain));
          }
        }
        
        // ユニークな概念のみを保持
        const uniqueConcepts = [...new Set([...baseConcepts, ...concepts])];
        
        if (combinedConfidence > maxConfidence) {
          maxConfidence = combinedConfidence;
          bestMatch = {
            domain: rule.domain,
            confidence: combinedConfidence,
            concepts: uniqueConcepts,
            businessImportance: importance
          };
        }
      }
    }
    
    if (bestMatch) {
      return bestMatch;
    }

    // デフォルト
    return {
      domain: 'unknown',
      confidence: 0.3,
      concepts: [],
      businessImportance: 'low'
    };
  }

  async inferDomainFromContext(context: DomainContext): Promise<DomainInference> {
    // ファイルパスからドメインを推論
    const pathParts = context.filePath.split('/');
    let inferredDomain = '';
    let confidence = 0;
    const concepts: string[] = [];

    // パスベースの推論（設定可能な信頼度を使用）
    if (pathParts.includes('auth') || pathParts.includes('authentication')) {
      inferredDomain = 'authentication';
      confidence = this.confidenceConfig.domainConfidenceMap?.['authentication'] || 0.9;
      concepts.push('認証', 'アクセス制御', 'セキュリティ');
    } else if (pathParts.includes('billing')) {
      inferredDomain = 'billing';
      confidence = this.confidenceConfig.domainConfidenceMap?.['billing'] || 0.88;
      concepts.push('請求', '課金');
    } else if (pathParts.includes('payment')) {
      inferredDomain = 'payment';
      confidence = this.confidenceConfig.domainConfidenceMap?.['payment'] || 0.9;
      concepts.push('決済', '支払い');
    }

    // クラス名からの推論
    if (context.className) {
      const classPattern = this.builtInPatterns.get(context.className);
      if (classPattern) {
        inferredDomain = classPattern.domain;
        confidence = Math.max(confidence, classPattern.confidence);
        classPattern.concepts.forEach(c => {
          if (!concepts.includes(c)) concepts.push(c);
        });
      }
    }

    // インポートからの推論
    const importDomains = new Set<string>();
    const uniqueRelatedDomains = new Set<string>();
    
    for (const imp of context.imports) {
      const pattern = this.builtInPatterns.get(imp);
      if (pattern) {
        importDomains.add(pattern.domain);
        // inferDomainFromContextで概念を追加する際、クラス名由来の概念と重複しないようにする
        if (context.className !== imp) {
          pattern.concepts.forEach(c => {
            if (!concepts.includes(c)) concepts.push(c);
          });
        }
      }

      // 特定のインポートパターン
      if (imp === 'TaxCalculator') {
        if (!concepts.includes('税務')) concepts.push('税務');
        if (inferredDomain === 'billing' && !concepts.includes('会計')) {
          concepts.push('会計');
        }
      }
      if (imp === 'Token' || imp === 'Permission') {
        uniqueRelatedDomains.add('security');
      }
      if (imp === 'Customer') {
        uniqueRelatedDomains.add('accounting');
      }
    }

    // 関連ドメインの設定
    if (inferredDomain === 'authentication') {
      uniqueRelatedDomains.add('user-management');
    } else if (inferredDomain === 'billing') {
      // Paymentインポートがあるかチェック
      for (const imp of context.imports) {
        if (imp === 'Payment') {
          uniqueRelatedDomains.add('payment');
          break;
        }
      }
    }

    // uniqueRelatedDomainsからrelatedDomains配列を生成（順序付き）
    const orderedRelatedDomains = Array.from(uniqueRelatedDomains).sort();

    const importance = await this.getDomainImportance(inferredDomain);

    return {
      domain: inferredDomain,
      confidence,
      concepts,
      businessImportance: importance,
      relatedDomains: orderedRelatedDomains.length > 0 ? orderedRelatedDomains : undefined
    };
  }

  async getDomainImportance(domain: string): Promise<BusinessImportance> {
    return this.domainImportanceMap.get(domain) || 'medium';
  }

  async loadDictionary(dictionary: DomainDictionary): Promise<void> {
    // 辞書をマージ（DRY原則: 既存の辞書に追加）
    this.domainDictionary.terms.push(...dictionary.terms);
    this.domainDictionary.rules.push(...dictionary.rules);
  }

  mergeInferences(inferences: DomainInference[]): DomainInference {
    if (inferences.length === 0) {
      return {
        domain: 'unknown',
        confidence: 0,
        concepts: [],
        businessImportance: 'low'
      };
    }

    // 最も信頼度の高い推論を選択（KISS原則）
    const best = inferences.reduce((prev, curr) => 
      curr.confidence > prev.confidence ? curr : prev
    );

    // 全ての概念を統合
    const allConcepts = new Set<string>();
    inferences.forEach(inf => inf.concepts.forEach(c => allConcepts.add(c)));

    return {
      ...best,
      concepts: Array.from(allConcepts)
    };
  }

  // プライベートヘルパーメソッド
  private inferConceptsFromDomain(domain: string): string[] {
    const conceptMap: Record<string, string[]> = {
      'user-management': ['ユーザー'],
      'service-layer': [],
      'data-access': ['データアクセス']
    };

    return conceptMap[domain] || [];
  }
  
  /**
   * 信頼度設定を適用
   */
  setConfidenceConfig(config: ConfidenceConfig): void {
    this.confidenceConfig = { ...this.confidenceConfig, ...config };
    
    // typeConfidenceMapが設定されている場合、builtInPatternsを更新
    if (config.typeConfidenceMap) {
      for (const [typeName, confidence] of Object.entries(config.typeConfidenceMap)) {
        const pattern = this.builtInPatterns.get(typeName);
        if (pattern) {
          pattern.confidence = confidence;
        }
      }
    }
  }
  
  /**
   * 設定された信頼度を取得（設定がない場合はデフォルト値を返す）
   */
  private getConfidence(typeName: string, defaultValue: number): number {
    // 設定された信頼度マップから取得
    if (this.confidenceConfig.typeConfidenceMap?.[typeName] !== undefined) {
      return this.confidenceConfig.typeConfidenceMap[typeName];
    }
    
    // builtInPatternsから取得
    const pattern = this.builtInPatterns.get(typeName);
    if (pattern) {
      return pattern.confidence;
    }
    
    // デフォルト値を返す
    return defaultValue;
  }
}