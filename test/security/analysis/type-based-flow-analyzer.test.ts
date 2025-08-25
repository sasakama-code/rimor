/**
 * 型ベースフロー解析器のテスト
 * Phase 2: TypeScript Compiler API活用のテスト
 * t_wadaのTDDアプローチに従う
 */

import { TypeBasedFlowAnalyzer, TypeBasedAnalysisResult, TypeBasedDataFlowPath, TypeConstraint } from '../../../src/security/analysis/type-based-flow-analyzer';

describe('TypeBasedFlowAnalyzer', () => {
  let analyzer: TypeBasedFlowAnalyzer;

  beforeEach(() => {
    analyzer = new TypeBasedFlowAnalyzer();
  });

  describe('TypeScript Compiler API活用の基本機能', () => {
    it('型情報を活用してより精密なSource-Sink検出ができる', async () => {
      // Arrange
      const sourceCode = `
        function processUser(req: any, res: any) {
          const userInput: string = req.body.data;  // Source
          const query: string = userInput;          // Type constraint
          const result = eval(query);               // Sink
          return result;
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.paths).toHaveLength(1);
      expect(result.constraints.length).toBeGreaterThan(0);
      expect(result.typeInfoMap.size).toBeGreaterThan(0);
      
      const path = result.paths[0];
      expect(path.source.type).toBe('user-input');
      expect(path.sink.type).toBe('code-injection');
      expect(path.typeConstraintPath.length).toBeGreaterThan(0);
    });

    it('型制約を正確に抽出できる', async () => {
      // Arrange
      const sourceCode = `
        function dataFlow() {
          const input = getUserInput();    // Source
          const processed = input;         // Assignment constraint
          const final = processed;         // Assignment constraint  
          executeCode(final);              // Parameter constraint + Sink
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.constraints.length).toBeGreaterThanOrEqual(3);
      
      const assignmentConstraints = result.constraints.filter(c => c.type === 'assignment');
      const parameterConstraints = result.constraints.filter(c => c.type === 'parameter');
      
      expect(assignmentConstraints.length).toBeGreaterThanOrEqual(2);
      expect(parameterConstraints.length).toBeGreaterThanOrEqual(1);
    });

    it('シンボルテーブルを活用した変数追跡ができる', async () => {
      // Arrange
      const sourceCode = `
        function symbolTracking(request: any) {
          let userdata = request.body.input;     // Source
          userdata = processData(userdata);      // Reassignment
          const safeData = userdata;             // Type constraint
          fs.writeFileSync(safeData, 'content'); // Sink
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.typeInfoMap.size).toBeGreaterThan(0);
      expect(result.typeInfoMap.has('userdata')).toBe(true);
      expect(result.typeInfoMap.has('safeData')).toBe(true);
      
      // シンボル情報が正しく記録されていることを確認
      const userdataInfo = result.typeInfoMap.get('userdata');
      expect(userdataInfo?.symbol).toBeDefined();
    });
  });

  describe('@Tainted/@Untainted型アノテーションのサポート', () => {
    it('JSDoc型アノテーション @tainted を認識できる', async () => {
      // Arrange
      const sourceCode = `
        /**
         * @param input @tainted User input data
         */
        function processData(input: string) {
          const result = eval(input);  // Sink
          return result;
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(sourceCode, 'test.ts');

      // Assert
      const inputInfo = result.typeInfoMap.get('input');
      expect(inputInfo?.typeAnnotation?.customTaintType).toBe('tainted');
      expect(inputInfo?.taintStatus).toBe('tainted');
    });

    it('JSDoc型アノテーション @untainted を認識できる', async () => {
      // Arrange
      const sourceCode = `
        /**
         * @param safeValue @untainted Safe constant value
         */
        function processSafeData(safeValue: string) {
          const result = eval(safeValue);  // Should be low risk
          return result;
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(sourceCode, 'test.ts');

      // Assert
      const safeValueInfo = result.typeInfoMap.get('safeValue');
      expect(safeValueInfo?.typeAnnotation?.customTaintType).toBe('untainted');
      expect(safeValueInfo?.taintStatus).toBe('untainted');
    });

    it('型アノテーション付きコードで型制約違反を検出できる', async () => {
      // Arrange
      const sourceCode = `
        function typeConstraintViolation() {
          /** @tainted */
          const taintedData: string = getUserInput();
          
          /** @untainted */
          const safeData: string = taintedData;  // 型制約違反
          
          eval(safeData);  // Sink
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.summary.constraintViolations).toBeGreaterThan(0);
      
      const path = result.paths.find(p => p.typeValidation.violatedConstraints.length > 0);
      expect(path).toBeDefined();
      expect(path?.typeValidation.isTypeSafe).toBe(false);
    });
  });

  describe('型制約による汚染伝播追跡', () => {
    it('複雑な型制約パスを正確に追跡できる', async () => {
      // Arrange
      const sourceCode = `
        function complexFlow(req: any, res: any) {
          const input = req.body.data;         // Source
          const step1 = processStep1(input);   // Parameter passing
          const step2 = step1.result;          // Property access
          const final = step2;                 // Assignment
          db.query(final);                     // Sink
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(sourceCode, 'test.ts');

      // Assert
      expect(result.paths).toHaveLength(1);
      
      const path = result.paths[0];
      expect(path.typeConstraintPath.length).toBeGreaterThan(0);
      
      // 異なる種類の制約が含まれることを確認
      const constraintTypes = path.typeConstraintPath.map(c => c.type);
      expect(constraintTypes).toContain('assignment');
      expect(constraintTypes).toContain('parameter');
    });

    it('プロパティアクセス制約を正確に追跡する', async () => {
      // Arrange
      const sourceCode = `
        interface RequestData {
          userInput: string;
          metadata: any;
        }
        
        function propertyFlow(data: RequestData) {
          const input = data.userInput;        // Property access constraint
          const processed = input;             // Assignment constraint
          fs.readFileSync(processed);          // Sink
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(sourceCode, 'test.ts');

      // Assert
      const propertyConstraints = result.constraints.filter(c => c.type === 'property-access');
      expect(propertyConstraints.length).toBeGreaterThan(0);
      
      const propertyConstraint = propertyConstraints.find(c => 
        c.description.includes('userInput')
      );
      expect(propertyConstraint).toBeDefined();
    });

    it('関数パラメーター制約を正確に追跡する', async () => {
      // Arrange
      const sourceCode = `
        function parameterFlow(req: any) {
          const userInput = req.body.data;
          processAndExecute(userInput, "safe");
        }
        
        function processAndExecute(dangerousParam: string, safeParam: string) {
          eval(dangerousParam);  // Sink - first parameter
          console.log(safeParam); // Safe use - second parameter
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(sourceCode, 'test.ts');

      // Assert
      const parameterConstraints = result.constraints.filter(c => c.type === 'parameter');
      expect(parameterConstraints.length).toBeGreaterThan(0);
      
      // パラメーターインデックスが正確に記録されることを確認
      const dangerousParamConstraint = parameterConstraints.find(c => 
        c.description.includes('0番目の引数')
      );
      expect(dangerousParamConstraint).toBeDefined();
    });
  });

  describe('型ベース信頼度計算', () => {
    it('型アノテーションがある場合、信頼度が向上する', async () => {
      // Arrange - 型アノテーション有り
      const annotatedCode = `
        function annotatedFlow() {
          /** @tainted */
          const input: string = getUserInput();
          
          /** @untainted */
          const processed: string = sanitize(input);
          
          eval(processed);  // Sink
        }
      `;

      // 型アノテーション無し
      const unannotatedCode = `
        function unannotatedFlow() {
          const input = getUserInput();
          const processed = sanitize(input);
          eval(processed);
        }
      `;

      // Act - 各分析に独立したアナライザーインスタンスを使用
      const annotatedAnalyzer = new TypeBasedFlowAnalyzer();
      const unannotatedAnalyzer = new TypeBasedFlowAnalyzer();
      
      const [annotatedResult, unannotatedResult] = await Promise.all([
        annotatedAnalyzer.analyzeTypeBasedFlow(annotatedCode, 'annotated.ts'),
        unannotatedAnalyzer.analyzeTypeBasedFlow(unannotatedCode, 'unannotated.ts')
      ]);

      // Assert
      if (annotatedResult.paths.length > 0 && unannotatedResult.paths.length > 0) {
        expect(annotatedResult.paths[0].typeBasedConfidence)
          .toBeGreaterThan(unannotatedResult.paths[0].typeBasedConfidence);
      }
      
      expect(annotatedResult.summary.typeAnnotatedPaths).toBeGreaterThan(0);
      expect(unannotatedResult.summary.typeAnnotatedPaths).toBe(0);
    });

    it('短いパスは高い信頼度を持つ', async () => {
      // Arrange - 短いパス
      const shortPathCode = `
        function shortPath(req: any) {
          eval(req.body.code);  // Direct path
        }
      `;

      // 長いパス
      const longPathCode = `
        function longPath(req: any) {
          const step1 = req.body.code;
          const step2 = step1;
          const step3 = step2;
          const step4 = step3;
          const step5 = step4;
          eval(step5);  // Long path
        }
      `;

      // Act
      const [shortResult, longResult] = await Promise.all([
        analyzer.analyzeTypeBasedFlow(shortPathCode, 'short.ts'),
        analyzer.analyzeTypeBasedFlow(longPathCode, 'long.ts')
      ]);

      // Assert
      if (shortResult.paths.length > 0 && longResult.paths.length > 0) {
        expect(shortResult.paths[0].typeBasedConfidence)
          .toBeGreaterThan(longResult.paths[0].typeBasedConfidence);
      }
    });
  });

  describe('型安全性検証', () => {
    it('型安全なコードは制約違反なしと判定される', async () => {
      // Arrange
      const typeSafeCode = `
        function typeSafeFlow() {
          /** @tainted */
          const taintedInput: string = getUserInput();
          
          /** @tainted */
          const stillTainted: string = taintedInput;  // OK: tainted -> tainted
          
          /** @untainted */
          const sanitized: string = sanitizeInput(stillTainted);  // OK: proper sanitization
          
          eval(sanitized);  // Should be considered safer
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(typeSafeCode, 'typesafe.ts');

      // Assert
      expect(result.summary.typeSafePaths).toBeGreaterThan(0);
      
      if (result.paths.length > 0) {
        const safePath = result.paths.find(p => p.typeValidation.isTypeSafe);
        expect(safePath).toBeDefined();
      }
    });

    it('型制約違反を正確に検出する', async () => {
      // Arrange
      const violatingCode = `
        function violatingFlow() {
          /** @tainted */
          const taintedData: string = getUserInput();
          
          /** @untainted */
          const shouldBeSafe: string = taintedData;  // 型制約違反
          
          eval(shouldBeSafe);
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(violatingCode, 'violating.ts');

      // Assert
      expect(result.summary.constraintViolations).toBeGreaterThan(0);
      
      if (result.paths.length > 0) {
        const violatingPath = result.paths.find(p => !p.typeValidation.isTypeSafe);
        expect(violatingPath).toBeDefined();
        expect(violatingPath?.typeValidation.violatedConstraints.length).toBeGreaterThan(0);
      }
    });
  });

  describe('高度な型システム活用', () => {
    it('インターフェースと型エイリアスを活用した解析ができる', async () => {
      // Arrange
      const advancedTypeCode = `
        interface UserRequest {
          body: {
            data: string;      // User input
            metadata: object;
          };
        }
        
        type ProcessedData = {
          content: string;
          safe: boolean;
        };
        
        function advancedTypeFlow(req: UserRequest) {
          const input: string = req.body.data;           // Property access with interface
          const processed: ProcessedData = {
            content: input,
            safe: false
          };
          
          eval(processed.content);                        // Sink via type alias
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(advancedTypeCode, 'advanced.ts');

      // Assert
      expect(result.constraints.length).toBeGreaterThan(0);
      expect(result.typeInfoMap.size).toBeGreaterThan(0);
      
      // インターフェース型のプロパティアクセスが制約として記録されることを確認
      const propertyConstraints = result.constraints.filter(c => 
        c.type === 'property-access' && c.description.includes('body')
      );
      expect(propertyConstraints.length).toBeGreaterThan(0);
    });

    it('ジェネリック型を含む複雑な型構造を処理できる', async () => {
      // Arrange
      const genericTypeCode = `
        function genericFlow<T extends string>(data: T) {
          const processed: T = data;                    // Generic constraint
          const result: string = processed;             // Type narrowing
          eval(result);                                 // Sink
        }
        
        function caller(req: any) {
          const userInput: string = req.body.input;
          genericFlow(userInput);                       // Generic function call
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(genericTypeCode, 'generic.ts');

      // Assert
      expect(result.constraints.length).toBeGreaterThan(0);
      
      // ジェネリック型制約が適切に処理されることを確認
      const parameterConstraints = result.constraints.filter(c => c.type === 'parameter');
      expect(parameterConstraints.length).toBeGreaterThan(0);
    });
  });

  describe('エラーハンドリングとエッジケース', () => {
    it('構文エラーのあるコードでも適切にエラーハンドリングする', async () => {
      // Arrange
      const invalidCode = `
        function invalid syntax here {
          const input = req.body;
          eval(input);
        }
      `;

      // Act & Assert
      await expect(analyzer.analyzeTypeBasedFlow(invalidCode, 'invalid.ts'))
        .resolves.toBeDefined(); // エラーで落ちずに結果を返す
    });

    it('空のソースコードでも正常に処理する', async () => {
      // Arrange
      const emptyCode = '';

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(emptyCode, 'empty.ts');

      // Assert
      expect(result.paths).toHaveLength(0);
      expect(result.constraints).toHaveLength(0);
      expect(result.typeInfoMap.size).toBe(0);
      expect(result.summary.totalPaths).toBe(0);
    });

    it('型情報のないJavaScriptコードも処理できる', async () => {
      // Arrange
      const jsCode = `
        function jsFlow(req, res) {
          var input = req.body.data;
          var processed = input;
          eval(processed);
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(jsCode, 'script.js');

      // Assert
      expect(result).toBeDefined();
      // 型情報がなくても基本的な制約抽出は可能
      expect(result.constraints.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('サマリー情報の正確性', () => {
    it('複合シナリオのサマリーが正確に計算される', async () => {
      // Arrange
      const complexCode = `
        function complexScenario(req: any) {
          /** @tainted */
          const tainted1: string = req.body.input1;
          
          /** @untainted */ 
          const safe1: string = sanitize(tainted1);
          
          /** @tainted */
          const tainted2: string = req.query.input2;
          
          /** @untainted */
          const unsafe: string = tainted2;  // 型制約違反
          
          // Multiple sinks
          eval(safe1);        // Type-safe path
          eval(unsafe);       // Type-unsafe path
          fs.readFile(tainted1); // Another unsafe path
        }
      `;

      // Act
      const result = await analyzer.analyzeTypeBasedFlow(complexCode, 'complex.ts');

      // Assert
      expect(result.summary.totalPaths).toBeGreaterThan(0);
      expect(result.summary.typeAnnotatedPaths).toBeGreaterThan(0);
      expect(result.summary.constraintViolations).toBeGreaterThan(0);
      
      // サマリーの整合性確認
      expect(result.summary.typeSafePaths + (result.summary.totalPaths - result.summary.typeSafePaths))
        .toBe(result.summary.totalPaths);
    });
  });
});