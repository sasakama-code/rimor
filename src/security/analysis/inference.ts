/**
 * 型ベースセキュリティ解析 - シグネチャベースの要件推論
 * メソッドシグネチャから必要なセキュリティテストを推論
 */

import {
  MethodSignature,
  Parameter,
  SecurityRequirement,
  SecurityType,
  AuthTestCoverage,
  TaintLevel,
  TaintSource,
  SecurityTestMetrics,
  TestMethod,
  TypeInferenceResult,
  SecurityTypeAnnotation
} from '../types';

/**
 * シグネチャベースの推論エンジン
 */
export class SignatureBasedInference {
  private knowledgeBase: SecurityKnowledgeBase;

  constructor() {
    this.knowledgeBase = new SecurityKnowledgeBase();
  }

  /**
   * メソッドシグネチャから必要なセキュリティテストを推論
   */
  inferRequirements(signature: MethodSignature): SecurityRequirement[] {
    const requirements: SecurityRequirement[] = [];

    // 認証関連の推論
    const authRequirements = this.inferAuthRequirements(signature);
    requirements.push(...authRequirements);

    // 入力検証関連の推論
    const inputRequirements = this.inferInputValidationRequirements(signature);
    requirements.push(...inputRequirements);

    // API関連の推論
    const apiRequirements = this.inferApiSecurityRequirements(signature);
    requirements.push(...apiRequirements);

    // セッション管理関連の推論
    const sessionRequirements = this.inferSessionManagementRequirements(signature);
    requirements.push(...sessionRequirements);

    return requirements;
  }

  /**
   * セキュリティ型の推論
   */
  async inferSecurityTypes(method: TestMethod): Promise<TypeInferenceResult> {
    const startTime = Date.now();
    const annotations: SecurityTypeAnnotation[] = [];

    // メソッドシグネチャからの推論
    const signatureAnnotations = this.inferFromSignature(method.signature);
    annotations.push(...signatureAnnotations);

    // メソッド内容からの推論
    const contentAnnotations = this.inferFromContent(method.content);
    annotations.push(...contentAnnotations);

    // 汚染レベルの推論
    const taintAnnotations = this.inferTaintLevels(method);
    annotations.push(...taintAnnotations);

    const totalVariables = this.countVariables(method.content);
    const inferredCount = annotations.length;
    const failedCount = Math.max(0, totalVariables - inferredCount);

    return {
      annotations,
      statistics: {
        totalVariables,
        inferred: inferredCount,
        failed: failedCount,
        averageConfidence: this.calculateAverageConfidence(annotations)
      },
      inferenceTime: Date.now() - startTime
    };
  }

  /**
   * メソッド品質の予測
   */
  predictMethodQuality(signature: MethodSignature): QualityPrediction {
    const complexity = this.calculateSignatureComplexity(signature);
    const securityRelevance = this.calculateSecurityRelevance(signature);
    const testingNeeds = this.assessTestingNeeds(signature);

    return {
      complexity,
      securityRelevance,
      testingNeeds,
      recommendedTestTypes: this.recommendTestTypes(signature),
      estimatedTestCount: this.estimateRequiredTestCount(signature),
      riskLevel: this.assessRiskLevel(signature)
    };
  }

  /**
   * 認証要件の推論
   */
  private inferAuthRequirements(signature: MethodSignature): SecurityRequirement[] {
    const requirements: SecurityRequirement[] = [];

    // メソッド名パターンによる判定
    if (this.isAuthRelated(signature.name)) {
      const authCoverageTypes = this.determineAuthCoverageTypes(signature);
      
      requirements.push({
        id: `auth-req-${signature.name}`,
        type: 'auth-test',
        required: authCoverageTypes,
        minTaintLevel: TaintLevel.UNTAINTED,
        applicableSources: [TaintSource.USER_INPUT]
      });
    }

    // パラメータによる判定
    const hasCredentialParams = signature.parameters.some(p => 
      this.isCredentialParameter(p.name)
    );

    if (hasCredentialParams) {
      requirements.push({
        id: `credential-req-${signature.name}`,
        type: 'auth-test',
        required: ['credential-validation', 'brute-force-protection', 'timing-attack-protection'],
        minTaintLevel: TaintLevel.DEFINITELY_TAINTED,
        applicableSources: [TaintSource.USER_INPUT]
      });
    }

    return requirements;
  }

  /**
   * 入力検証要件の推論
   */
  private inferInputValidationRequirements(signature: MethodSignature): SecurityRequirement[] {
    const requirements: SecurityRequirement[] = [];

    // ユーザー入力パラメータの検出
    const userInputParams = signature.parameters.filter(p => 
      p.source === 'user-input' || this.isUserInputParameter(p.name)
    );

    if (userInputParams.length > 0) {
      const validationTypes = this.determineValidationTypes(userInputParams);
      
      requirements.push({
        id: `input-validation-req-${signature.name}`,
        type: 'input-validation',
        required: validationTypes,
        minTaintLevel: TaintLevel.POSSIBLY_TAINTED,
        applicableSources: [TaintSource.USER_INPUT, TaintSource.EXTERNAL_API]
      });
    }

    // 特殊なデータ型の検出
    const hasFileParams = signature.parameters.some(p => 
      this.isFileParameter(p.type || p.name)
    );

    if (hasFileParams) {
      requirements.push({
        id: `file-validation-req-${signature.name}`,
        type: 'input-validation',
        required: ['file-type-validation', 'file-size-validation', 'malware-scanning'],
        minTaintLevel: TaintLevel.LIKELY_TAINTED,
        applicableSources: [TaintSource.FILE_SYSTEM]
      });
    }

    return requirements;
  }

  /**
   * API セキュリティ要件の推論
   */
  private inferApiSecurityRequirements(signature: MethodSignature): SecurityRequirement[] {
    const requirements: SecurityRequirement[] = [];

    // API アノテーションの検出
    const isApiEndpoint = (signature.annotations || []).some(annotation => 
      this.isApiAnnotation(annotation)
    ) || this.isApiMethodName(signature.name);

    if (isApiEndpoint) {
      const securityFeatures = this.determineApiSecurityFeatures(signature);
      
      requirements.push({
        id: `api-security-req-${signature.name}`,
        type: 'api-security',
        required: securityFeatures,
        minTaintLevel: TaintLevel.POSSIBLY_TAINTED,
        applicableSources: [TaintSource.USER_INPUT, TaintSource.NETWORK]
      });
    }

    return requirements;
  }

  /**
   * セッション管理要件の推論
   */
  private inferSessionManagementRequirements(signature: MethodSignature): SecurityRequirement[] {
    const requirements: SecurityRequirement[] = [];

    // セッション関連メソッドの検出
    if (this.isSessionRelated(signature.name)) {
      requirements.push({
        id: `session-req-${signature.name}`,
        type: 'session-management',
        required: ['session-validation', 'session-timeout', 'concurrent-session-control'],
        minTaintLevel: TaintLevel.POSSIBLY_TAINTED,
        applicableSources: [TaintSource.USER_INPUT]
      });
    }

    return requirements;
  }

  /**
   * シグネチャからの型推論
   */
  private inferFromSignature(signature: MethodSignature): SecurityTypeAnnotation[] {
    const annotations: SecurityTypeAnnotation[] = [];

    // パラメータからの推論
    signature.parameters.forEach(param => {
      const securityType = this.inferParameterSecurityType(param);
      const taintLevel = this.inferParameterTaintLevel(param);
      
      if (securityType) {
        annotations.push({
          target: param.name,
          securityType,
          taintLevel,
          confidence: 0.85,
          evidence: [`Parameter type: ${param.type}`, `Parameter source: ${param.source}`]
        });
      }
    });

    // メソッド名からの推論
    const methodSecurityType = this.inferFromMethodName(signature.name);
    if (methodSecurityType) {
      annotations.push({
        target: `method_${signature.name}`,
        securityType: methodSecurityType,
        taintLevel: TaintLevel.UNTAINTED,
        confidence: 0.7,
        evidence: [`Method name pattern: ${signature.name}`]
      });
    }

    return annotations;
  }

  /**
   * メソッド内容からの型推論
   */
  private inferFromContent(content: string): SecurityTypeAnnotation[] {
    const annotations: SecurityTypeAnnotation[] = [];

    // 変数宣言の検出
    const variableDeclarations = this.extractVariableDeclarations(content);
    variableDeclarations.forEach(decl => {
      const securityType = this.inferVariableSecurityType(decl);
      if (securityType) {
        annotations.push({
          target: decl.name,
          securityType: securityType.type,
          taintLevel: securityType.taintLevel,
          confidence: securityType.confidence,
          evidence: securityType.evidence
        });
      }
    });

    // セキュリティ関連API呼び出しの検出
    const apiCalls = this.extractSecurityApiCalls(content);
    apiCalls.forEach(call => {
      annotations.push({
        target: call.variable || call.method,
        securityType: call.securityType,
        taintLevel: call.resultTaintLevel,
        confidence: 0.8,
        evidence: [`Security API call: ${call.method}`]
      });
    });

    return annotations;
  }

  /**
   * 汚染レベルの推論
   */
  private inferTaintLevels(method: TestMethod): SecurityTypeAnnotation[] {
    const annotations: SecurityTypeAnnotation[] = [];
    const content = method.content;

    // ユーザー入力の検出
    const userInputs = this.detectUserInputs(content);
    userInputs.forEach(input => {
      annotations.push({
        target: input.variable,
        securityType: SecurityType.USER_INPUT,
        taintLevel: TaintLevel.DEFINITELY_TAINTED,
        confidence: 0.9,
        evidence: [`User input detected: ${input.source}`]
      });
    });

    // サニタイザーの効果
    const sanitizedVars = this.detectSanitizedVariables(content);
    sanitizedVars.forEach(variable => {
      annotations.push({
        target: variable,
        securityType: SecurityType.SANITIZED_DATA,
        taintLevel: TaintLevel.UNTAINTED,
        confidence: 0.85,
        evidence: ['Sanitizer applied']
      });
    });

    return annotations;
  }

  // ヘルパーメソッドの実装
  private isAuthRelated(methodName: string): boolean {
    const patterns = ['auth', 'login', 'logout', 'signin', 'signout', 'authenticate', 'authorize'];
    return patterns.some(pattern => 
      methodName.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private determineAuthCoverageTypes(signature: MethodSignature): string[] {
    const types = ['success', 'failure'];
    
    if (signature.name.toLowerCase().includes('token')) {
      types.push('token-expiry', 'token-validation');
    }
    
    if (signature.name.toLowerCase().includes('password')) {
      types.push('brute-force-protection');
    }
    
    return types;
  }

  private isCredentialParameter(paramName: string): boolean {
    const patterns = ['password', 'passwd', 'token', 'credential', 'auth', 'login'];
    return patterns.some(pattern => 
      paramName.toLowerCase().includes(pattern)
    );
  }

  private isUserInputParameter(paramName: string): boolean {
    const patterns = ['input', 'data', 'value', 'param', 'body', 'query'];
    return patterns.some(pattern => 
      paramName.toLowerCase().includes(pattern)
    );
  }

  private isFileParameter(paramType: string): boolean {
    const patterns = ['file', 'upload', 'attachment', 'document', 'image'];
    return patterns.some(pattern => 
      paramType.toLowerCase().includes(pattern)
    );
  }

  private determineValidationTypes(params: Parameter[]): string[] {
    const types = ['input-validation', 'type-validation'];
    
    if (params.some(p => p.type?.includes('string'))) {
      types.push('string-validation', 'length-validation');
    }
    
    if (params.some(p => p.type?.includes('number'))) {
      types.push('numeric-validation', 'range-validation');
    }
    
    return types;
  }

  private isApiAnnotation(annotation: string): boolean {
    const patterns = ['@api', '@endpoint', '@route', '@controller', '@restcontroller'];
    return patterns.some(pattern => 
      annotation.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private isApiMethodName(methodName: string): boolean {
    const patterns = ['endpoint', 'api', 'route', 'handler', 'controller'];
    return patterns.some(pattern => 
      methodName.toLowerCase().includes(pattern)
    );
  }

  private determineApiSecurityFeatures(signature: MethodSignature): string[] {
    const features = ['authentication', 'authorization', 'input-validation'];
    
    if (signature.parameters.length > 0) {
      features.push('parameter-validation');
    }
    
    if (signature.name.toLowerCase().includes('public')) {
      features.push('rate-limiting');
    }
    
    return features;
  }

  private isSessionRelated(methodName: string): boolean {
    const patterns = ['session', 'cookie', 'state', 'context'];
    return patterns.some(pattern => 
      methodName.toLowerCase().includes(pattern)
    );
  }

  private inferParameterSecurityType(param: Parameter): SecurityType | undefined {
    if (param.source === 'user-input') {
      return SecurityType.USER_INPUT;
    }
    
    if (this.isCredentialParameter(param.name)) {
      return SecurityType.AUTH_TOKEN;
    }
    
    return undefined;
  }

  private inferParameterTaintLevel(param: Parameter): TaintLevel {
    if (param.source === 'user-input') {
      return TaintLevel.DEFINITELY_TAINTED;
    }
    
    if (param.source === 'database') {
      return TaintLevel.POSSIBLY_TAINTED;
    }
    
    return TaintLevel.UNTAINTED;
  }

  private inferFromMethodName(methodName: string): SecurityType | undefined {
    if (this.isAuthRelated(methodName)) {
      return SecurityType.AUTH_TOKEN;
    }
    
    if (methodName.toLowerCase().includes('validate')) {
      return SecurityType.VALIDATED_INPUT;
    }
    
    return undefined;
  }

  private extractVariableDeclarations(content: string): VariableDeclaration[] {
    const declarations: VariableDeclaration[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/(const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+);?/);
      if (match) {
        declarations.push({
          name: match[2],
          type: match[1],
          initializer: match[3].trim(),
          line: index + 1
        });
      }
    });
    
    return declarations;
  }

  private inferVariableSecurityType(decl: VariableDeclaration): InferredSecurityType | undefined {
    const initializer = decl.initializer.toLowerCase();
    
    if (initializer.includes('req.body') || initializer.includes('req.query')) {
      return {
        type: SecurityType.USER_INPUT,
        taintLevel: TaintLevel.DEFINITELY_TAINTED,
        confidence: 0.9,
        evidence: ['Request parameter assignment']
      };
    }
    
    if (initializer.includes('sanitize') || initializer.includes('validate')) {
      return {
        type: SecurityType.SANITIZED_DATA,
        taintLevel: TaintLevel.UNTAINTED,
        confidence: 0.85,
        evidence: ['Sanitization function call']
      };
    }
    
    return undefined;
  }

  private extractSecurityApiCalls(content: string): SecurityApiCall[] {
    const calls: SecurityApiCall[] = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      // JWT トークン関連
      if (line.includes('jwt.verify') || line.includes('jwt.sign')) {
        calls.push({
          method: 'jwt',
          securityType: SecurityType.AUTH_TOKEN,
          resultTaintLevel: TaintLevel.UNTAINTED,
          variable: this.extractAssignmentTarget(line)
        });
      }
      
      // 暗号化関連
      if (line.includes('bcrypt') || line.includes('crypto')) {
        calls.push({
          method: 'crypto',
          securityType: SecurityType.SANITIZED_DATA,
          resultTaintLevel: TaintLevel.UNTAINTED,
          variable: this.extractAssignmentTarget(line)
        });
      }
    });
    
    return calls;
  }

  private detectUserInputs(content: string): UserInputDetection[] {
    const inputs: UserInputDetection[] = [];
    const patterns = [
      { pattern: /(\w+)\s*=\s*req\.body/g, source: 'request body' },
      { pattern: /(\w+)\s*=\s*req\.query/g, source: 'query parameter' },
      { pattern: /(\w+)\s*=\s*req\.params/g, source: 'path parameter' }
    ];
    
    patterns.forEach(({ pattern, source }) => {
      const matches = [...content.matchAll(pattern)];
      matches.forEach(match => {
        inputs.push({
          variable: match[1],
          source,
          confidence: 0.9
        });
      });
    });
    
    return inputs;
  }

  private detectSanitizedVariables(content: string): string[] {
    const variables: string[] = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.includes('sanitize(') || line.includes('escape(') || line.includes('validate(')) {
        const target = this.extractAssignmentTarget(line);
        if (target) {
          variables.push(target);
        }
      }
    });
    
    return variables;
  }

  private extractAssignmentTarget(line: string): string | undefined {
    const match = line.match(/^\s*(const|let|var)?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=/);
    return match ? match[2] : undefined;
  }

  private countVariables(content: string): number {
    const matches = content.match(/(const|let|var)\s+[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    return matches.length;
  }

  private calculateAverageConfidence(annotations: SecurityTypeAnnotation[]): number {
    if (annotations.length === 0) return 0;
    const total = annotations.reduce((sum, annotation) => sum + annotation.confidence, 0);
    return total / annotations.length;
  }

  private calculateSignatureComplexity(signature: MethodSignature): number {
    let complexity = 1; // base complexity
    complexity += signature.parameters.length * 0.2;
    complexity += (signature.annotations || []).length * 0.1;
    return Math.min(10, complexity);
  }

  private calculateSecurityRelevance(signature: MethodSignature): number {
    let relevance = 0;
    
    if (this.isAuthRelated(signature.name)) relevance += 0.4;
    if (signature.parameters.some(p => p.source === 'user-input')) relevance += 0.3;
    if ((signature.annotations || []).some(a => this.isApiAnnotation(a))) relevance += 0.2;
    if (signature.parameters.some(p => this.isCredentialParameter(p.name))) relevance += 0.1;
    
    return Math.min(1.0, relevance);
  }

  private assessTestingNeeds(signature: MethodSignature): TestingNeeds {
    const securityRelevance = this.calculateSecurityRelevance(signature);
    const complexity = this.calculateSignatureComplexity(signature);
    
    return {
      priority: securityRelevance > 0.5 ? 'high' : 'medium',
      estimatedEffort: Math.ceil(complexity * securityRelevance * 10),
      requiredCoverage: securityRelevance * 0.8 + 0.2
    };
  }

  private recommendTestTypes(signature: MethodSignature): string[] {
    const types: string[] = [];
    
    if (this.isAuthRelated(signature.name)) {
      types.push('authentication-test', 'authorization-test');
    }
    
    if (signature.parameters.some(p => p.source === 'user-input')) {
      types.push('input-validation-test', 'boundary-test');
    }
    
    if ((signature.annotations || []).some(a => this.isApiAnnotation(a))) {
      types.push('api-security-test', 'integration-test');
    }
    
    return types.length > 0 ? types : ['unit-test'];
  }

  private estimateRequiredTestCount(signature: MethodSignature): number {
    const base = 2; // minimum tests
    let count = base;
    
    count += signature.parameters.length; // parameter combinations
    if (this.isAuthRelated(signature.name)) count += 3; // auth scenarios
    if (signature.parameters.some(p => p.source === 'user-input')) count += 2; // input validation
    
    return Math.min(15, count); // reasonable upper limit
  }

  private assessRiskLevel(signature: MethodSignature): 'low' | 'medium' | 'high' | 'critical' {
    const securityRelevance = this.calculateSecurityRelevance(signature);
    const hasUserInput = signature.parameters.some(p => p.source === 'user-input');
    const isAuthRelated = this.isAuthRelated(signature.name);
    
    if (isAuthRelated && hasUserInput && securityRelevance > 0.7) return 'critical';
    if (securityRelevance > 0.5) return 'high';
    if (hasUserInput || securityRelevance > 0.3) return 'medium';
    return 'low';
  }
}

/**
 * セキュリティ知識ベース
 */
class SecurityKnowledgeBase {
  // セキュリティパターンや脅威モデルの知識を保持
  // 現在は簡易実装
}

// 関連するインターフェースの定義
interface QualityPrediction {
  complexity: number;
  securityRelevance: number;
  testingNeeds: TestingNeeds;
  recommendedTestTypes: string[];
  estimatedTestCount: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface TestingNeeds {
  priority: 'low' | 'medium' | 'high';
  estimatedEffort: number;
  requiredCoverage: number;
}

interface VariableDeclaration {
  name: string;
  type: string;
  initializer: string;
  line: number;
}

interface InferredSecurityType {
  type: SecurityType;
  taintLevel: TaintLevel;
  confidence: number;
  evidence: string[];
}

interface SecurityApiCall {
  method: string;
  securityType: SecurityType;
  resultTaintLevel: TaintLevel;
  variable?: string;
}

interface UserInputDetection {
  variable: string;
  source: string;
  confidence: number;
}