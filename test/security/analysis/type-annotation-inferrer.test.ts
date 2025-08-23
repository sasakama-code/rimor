/**
 * 型アノテーション自動推論エンジンのテスト
 * Phase 3: 自動推論機能のテスト
 * t_wadaのTDDアプローチに従う
 */

import { 
  TypeAnnotationInferrer,
  InferredTypeAnnotation,
  TypeAnnotationSuggestion,
  TypeAnnotationInferenceResult
} from '../../../src/security/analysis/type-annotation-inferrer';
import { TypeConstraint, TypeBasedTaintInfo } from '../../../src/security/analysis/type-based-flow-analyzer';
import { TaintSource } from '../../../src/security/analysis/ast-source-detector';
import { TaintSink } from '../../../src/security/analysis/ast-sink-detector';

describe('TypeAnnotationInferrer', () => {
  let inferrer: TypeAnnotationInferrer;

  beforeEach(() => {
    inferrer = new TypeAnnotationInferrer();
  });

  describe('基本的な型アノテーション推論', () => {
    it('Source変数のtaintedアノテーションを推論できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'userInput',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [];
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];
      
      const sourceCode = `
        function test(req) {
          const userInput = req.body.data;
          return userInput;
        }
      `;

      // Act
      const result = await inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, sourceCode, 'test.ts'
      );

      // Assert
      expect(result.inferredAnnotations).toHaveLength(1);
      
      const annotation = result.inferredAnnotations[0];
      expect(annotation.variableName).toBe('userInput');
      expect(annotation.inferredTaintType).toBe('tainted');
      expect(annotation.jsDocAnnotation).toBe('@tainted');
      expect(annotation.confidence).toBeGreaterThan(0.7);
      expect(annotation.reasoning.length).toBeGreaterThan(0);
    });

    it('代入制約による汚染伝播推論を実行できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'input',
        apiCall: { functionName: 'req.query', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [
        {
          type: 'assignment',
          sourceVariable: 'input',
          targetVariable: 'processed',
          location: { file: 'test.ts', line: 2, column: 1 },
          description: '代入: input → processed'
        },
        {
          type: 'assignment',
          sourceVariable: 'processed',
          targetVariable: 'final',
          location: { file: 'test.ts', line: 3, column: 1 },
          description: '代入: processed → final'
        }
      ];

      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];
      
      const sourceCode = `
        function test(req) {
          const input = req.query.search;
          const processed = input;
          const final = processed;
          return final;
        }
      `;

      // Act
      const result = await inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, sourceCode, 'test.ts'
      );

      // Assert
      expect(result.inferredAnnotations).toHaveLength(3);
      
      // すべてtaintedと推論されることを確認
      for (const annotation of result.inferredAnnotations) {
        expect(annotation.inferredTaintType).toBe('tainted');
        expect(annotation.jsDocAnnotation).toBe('@tainted');
      }

      // 変数名が正しく推論されることを確認
      const variableNames = result.inferredAnnotations.map(a => a.variableName);
      expect(variableNames).toContain('input');
      expect(variableNames).toContain('processed');
      expect(variableNames).toContain('final');
    });

    it('型アノテーション付き変数の推論信頼度が向上することを確認できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'annotatedVar',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [];
      
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      typeInfoMap.set('annotatedVar', {
        symbol: {} as any,
        taintStatus: 'tainted',
        typeAnnotation: {
          isTaintedAnnotation: false,
          isUntaintedAnnotation: false,
          customTaintType: 'tainted'
        },
        typeConstraints: []
      });

      const sinks: TaintSink[] = [];
      
      const sourceCode = `
        function test(req) {
          /** @tainted */
          const annotatedVar = req.body.data;
          return annotatedVar;
        }
      `;

      // Act
      const result = await inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, sourceCode, 'test.ts'
      );

      // Assert
      expect(result.inferredAnnotations).toHaveLength(1);
      
      const annotation = result.inferredAnnotations[0];
      expect(annotation.confidence).toBeGreaterThan(0.8); // 既存アノテーションで信頼度向上
      expect(annotation.reasoning).toContain('既存の型アノテーション（tainted）と一致');
    });
  });

  describe('提案生成機能', () => {
    it('アノテーションがない変数に追加提案を生成できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'unannotatedVar',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [];
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];
      
      const sourceCode = `
        function test(req) {
          const unannotatedVar = req.body.data;
          return unannotatedVar;
        }
      `;

      // Act
      const result = await inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, sourceCode, 'test.ts'
      );

      // Assert
      expect(result.suggestions).toHaveLength(1);
      
      const suggestion = result.suggestions[0];
      expect(suggestion.type).toBe('add');
      expect(suggestion.targetVariable).toBe('unannotatedVar');
      expect(suggestion.suggestedAnnotation).toBe('@tainted');
      expect(suggestion.priority).toBe('high');
      expect(suggestion.autoApplicable).toBe(true);
    });

    it('既存アノテーションと異なる推論結果で修正提案を生成できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'conflictVar',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [];
      
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      typeInfoMap.set('conflictVar', {
        symbol: {} as any,
        taintStatus: 'untainted', // 既存は untainted
        typeAnnotation: {
          isTaintedAnnotation: false,
          isUntaintedAnnotation: false,
          customTaintType: 'untainted'
        },
        typeConstraints: []
      });

      const sinks: TaintSink[] = [];
      
      const sourceCode = `
        function test(req) {
          /** @untainted */
          const conflictVar = req.body.data; // 実際は tainted
          return conflictVar;
        }
      `;

      // Act
      const result = await inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, sourceCode, 'test.ts'
      );

      // Assert
      expect(result.suggestions).toHaveLength(1);
      
      const suggestion = result.suggestions[0];
      expect(suggestion.type).toBe('modify');
      expect(suggestion.targetVariable).toBe('conflictVar');
      expect(suggestion.currentAnnotation).toBe('untainted');
      expect(suggestion.suggestedAnnotation).toBe('@tainted');
      expect(suggestion.autoApplicable).toBe(false); // 修正は慎重に
    });

    it('信頼度に基づいて提案の優先度を決定できる', async () => {
      // Arrange
      const sources: TaintSource[] = [
        {
          type: 'user-input',
          category: 'http-request',
          location: { file: 'test.ts', line: 1, column: 1, length: 10 },
          variableName: 'highConfVar',
          apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
          confidence: 0.95
        },
        {
          type: 'network-input',
          category: 'http-client',
          location: { file: 'test.ts', line: 2, column: 1, length: 10 },
          variableName: 'mediumConfVar',
          apiCall: { functionName: 'fetch', objectName: '', arguments: [] },
          confidence: 0.70
        }
      ];

      const typeConstraints: TypeConstraint[] = [];
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];
      
      const sourceCode = `
        function test(req) {
          const highConfVar = req.body.data;
          const mediumConfVar = fetch(url);
          return { highConfVar, mediumConfVar };
        }
      `;

      // Act
      const result = await inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, sourceCode, 'test.ts'
      );

      // Assert
      expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
      
      // 高信頼度の提案が先頭にくることを確認
      const firstSuggestion = result.suggestions[0];
      expect(firstSuggestion.priority).toBe('high');
      
      // 提案が優先度順にソートされていることを確認
      const priorities = result.suggestions.map(s => s.priority);
      expect(priorities.indexOf('high')).toBeLessThanOrEqual(priorities.indexOf('medium'));
    });
  });

  describe('統計情報と品質評価', () => {
    it('統計情報を正確に計算する', async () => {
      // Arrange
      const sources: TaintSource[] = [
        {
          type: 'user-input',
          category: 'http-request',
          location: { file: 'test.ts', line: 1, column: 1, length: 10 },
          variableName: 'taintedVar1',
          apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
          confidence: 0.95
        },
        {
          type: 'user-input',
          category: 'http-request',
          location: { file: 'test.ts', line: 2, column: 1, length: 10 },
          variableName: 'taintedVar2',
          apiCall: { functionName: 'req.query', objectName: 'req', arguments: [] },
          confidence: 0.95
        }
      ];

      const typeConstraints: TypeConstraint[] = [];
      
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      // 既存アノテーション付き変数を追加
      typeInfoMap.set('existingAnnotated', {
        symbol: {} as any,
        taintStatus: 'untainted',
        typeAnnotation: {
          isTaintedAnnotation: false,
          isUntaintedAnnotation: false,
          customTaintType: 'untainted'
        },
        typeConstraints: []
      });

      const sinks: TaintSink[] = [];
      
      const sourceCode = `
        function test(req) {
          const taintedVar1 = req.body.data;
          const taintedVar2 = req.query.search;
          /** @untainted */
          const existingAnnotated = "safe";
          return { taintedVar1, taintedVar2, existingAnnotated };
        }
      `;

      // Act
      const result = await inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, sourceCode, 'test.ts'
      );

      // Assert
      expect(result.statistics.totalVariables).toBe(3);
      expect(result.statistics.annotatedVariables).toBe(1); // existingAnnotated
      expect(result.statistics.inferredVariables).toBeGreaterThanOrEqual(2);
      expect(result.statistics.taintedVariables).toBe(2); // taintedVar1, taintedVar2
      expect(result.statistics.untaintedVariables).toBeGreaterThanOrEqual(1); // existingAnnotated
    });

    it('品質評価メトリクスを計算する', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'userInput',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [];
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];
      
      const sourceCode = `
        function test(req) {
          const userInput = req.body.data;
          return userInput;
        }
      `;

      // Act
      const result = await inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, sourceCode, 'test.ts'
      );

      // Assert
      expect(result.qualityMetrics.averageConfidence).toBeGreaterThan(0);
      expect(result.qualityMetrics.coverageRatio).toBeGreaterThan(0);
      expect(result.qualityMetrics.suggestionAcceptanceRate).toBeGreaterThanOrEqual(0);
      
      // 高信頼度推論の場合、平均信頼度は高くなる
      expect(result.qualityMetrics.averageConfidence).toBeGreaterThan(0.7);
    });

    it('推論根拠の詳細説明を生成する', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'userInput',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [];
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];
      
      const sourceCode = `
        function test(req) {
          const userInput = req.body.data;
          return userInput;
        }
      `;

      // Act
      const result = await inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, sourceCode, 'test.ts'
      );

      // Assert
      expect(result.inferredAnnotations).toHaveLength(1);
      
      const annotation = result.inferredAnnotations[0];
      expect(annotation.reasoning).toContain('ユーザー入力やネットワークデータなど信頼できないソースから派生');
    });
  });

  describe('TypeScript型システム統合', () => {
    it('TypeScript形式の型アノテーションを生成できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'userInput',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [];
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];
      
      const sourceCode = `
        function test(req: any) {
          const userInput = req.body.data;
          return userInput;
        }
      `;

      // Act
      const result = await inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, sourceCode, 'test.ts'
      );

      // Assert
      expect(result.inferredAnnotations).toHaveLength(1);
      
      const annotation = result.inferredAnnotations[0];
      expect(annotation.typeScriptAnnotation).toBe('Tainted<string>');
      expect(annotation.jsDocAnnotation).toBe('@tainted');
    });

    it('位置情報を正確に取得できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 2, column: 9, length: 10 },
        variableName: 'userInput',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [];
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];
      
      const sourceCode = `function test(req: any) {
  const userInput = req.body.data;
  return userInput;
}`;

      // Act
      const result = await inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, sourceCode, 'test.ts'
      );

      // Assert
      expect(result.inferredAnnotations).toHaveLength(1);
      
      const annotation = result.inferredAnnotations[0];
      expect(annotation.location.file).toBe('test.ts');
      expect(annotation.location.line).toBe(2);
      expect(annotation.location.column).toBeGreaterThan(0);
    });
  });

  describe('レポート生成機能', () => {
    it('推論結果の詳細レポートを生成できる', async () => {
      // Arrange
      const sources: TaintSource[] = [{
        type: 'user-input',
        category: 'http-request',
        location: { file: 'test.ts', line: 1, column: 1, length: 10 },
        variableName: 'userInput',
        apiCall: { functionName: 'req.body', objectName: 'req', arguments: [] },
        confidence: 0.95
      }];

      const typeConstraints: TypeConstraint[] = [];
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];
      
      const sourceCode = `
        function test(req) {
          const userInput = req.body.data;
          return userInput;
        }
      `;

      // Act
      const result = await inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, sourceCode, 'test.ts'
      );
      const report = inferrer.generateInferenceReport(result);

      // Assert
      expect(report).toContain('型アノテーション推論レポート');
      expect(report).toContain('統計情報');
      expect(report).toContain('品質評価');
      expect(report).toContain('高信頼度推論結果');
      expect(report).toContain('推奨アクション');
      expect(report).toContain('userInput');
      expect(report).toContain('@tainted');
    });
  });

  describe('エラーハンドリング', () => {
    it('空の入力でも正常に処理する', async () => {
      // Arrange
      const sources: TaintSource[] = [];
      const typeConstraints: TypeConstraint[] = [];
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];
      const sourceCode = '';

      // Act
      const result = await inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, sourceCode, 'empty.ts'
      );

      // Assert
      expect(result.inferredAnnotations).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
      expect(result.statistics.totalVariables).toBe(0);
      expect(result.qualityMetrics.averageConfidence).toBe(0);
    });

    it('不正なソースコードでも適切にエラーハンドリングする', async () => {
      // Arrange
      const sources: TaintSource[] = [];
      const typeConstraints: TypeConstraint[] = [];
      const typeInfoMap = new Map<string, TypeBasedTaintInfo>();
      const sinks: TaintSink[] = [];
      const invalidCode = 'invalid syntax here {{{';

      // Act & Assert
      await expect(inferrer.inferTypeAnnotations(
        typeConstraints, typeInfoMap, sources, sinks, invalidCode, 'invalid.ts'
      )).resolves.toBeDefined(); // エラーで落ちずに結果を返す
    });
  });
});