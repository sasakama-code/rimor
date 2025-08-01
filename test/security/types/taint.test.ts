/**
 * 型ベースセキュリティ解析 - 汚染レベル定義のテスト
 */

import {
  TaintLevel,
  TaintSource,
  SecuritySink,
  SanitizerType,
  TaintLattice,
  TaintedValue,
  Sanitizer,
  TaintPropagation,
  TaintAnalyzer,
  TaintTypeInference,
  TaintTypeChecker,
  compareTaintLevels,
  getTaintSourceRisk,
  TaintMetadata,
  TaintTraceStep
} from '../../../src/security/types/taint';

describe('TaintLevel', () => {
  it('汚染レベルが正しい順序で定義されていること', () => {
    expect(TaintLevel.CLEAN).toBe(0);
    expect(TaintLevel.UNTAINTED).toBe(0);
    expect(TaintLevel.POSSIBLY_TAINTED).toBe(1);
    expect(TaintLevel.LIKELY_TAINTED).toBe(2);
    expect(TaintLevel.DEFINITELY_TAINTED).toBe(3);
    expect(TaintLevel.HIGHLY_TAINTED).toBe(4);
  });

  it('汚染レベルの大小比較が正しく動作すること', () => {
    expect(TaintLevel.CLEAN < TaintLevel.POSSIBLY_TAINTED).toBe(true);
    expect(TaintLevel.POSSIBLY_TAINTED < TaintLevel.LIKELY_TAINTED).toBe(true);
    expect(TaintLevel.LIKELY_TAINTED < TaintLevel.DEFINITELY_TAINTED).toBe(true);
    expect(TaintLevel.DEFINITELY_TAINTED < TaintLevel.HIGHLY_TAINTED).toBe(true);
  });
});

describe('TaintSource', () => {
  it('汚染源が適切に定義されていること', () => {
    expect(TaintSource.USER_INPUT).toBe('user-input');
    expect(TaintSource.EXTERNAL_API).toBe('external-api');
    expect(TaintSource.ENVIRONMENT).toBe('environment');
    expect(TaintSource.FILE_SYSTEM).toBe('file-system');
    expect(TaintSource.DATABASE).toBe('database');
    expect(TaintSource.NETWORK).toBe('network');
  });
});

describe('SecuritySink', () => {
  it('セキュリティシンクが適切に定義されていること', () => {
    expect(SecuritySink.DATABASE_QUERY).toBe('database-query');
    expect(SecuritySink.HTML_OUTPUT).toBe('html-output');
    expect(SecuritySink.JAVASCRIPT_EXEC).toBe('javascript-exec');
    expect(SecuritySink.SYSTEM_COMMAND).toBe('system-command');
    expect(SecuritySink.FILE_WRITE).toBe('file-write');
    expect(SecuritySink.TEST_ASSERTION).toBe('test-assertion');
  });
});

describe('SanitizerType', () => {
  it('サニタイザータイプが適切に定義されていること', () => {
    expect(SanitizerType.HTML_ESCAPE).toBe('html-escape');
    expect(SanitizerType.SQL_ESCAPE).toBe('sql-escape');
    expect(SanitizerType.INPUT_VALIDATION).toBe('input-validation');
    expect(SanitizerType.TYPE_CONVERSION).toBe('type-conversion');
    expect(SanitizerType.STRING_SANITIZE).toBe('string-sanitize');
    expect(SanitizerType.JSON_PARSE).toBe('json-parse');
  });
});

describe('TaintLattice', () => {
  describe('join演算', () => {
    it('より高い汚染レベルを選択すること', () => {
      expect(TaintLattice.join(TaintLevel.CLEAN, TaintLevel.POSSIBLY_TAINTED))
        .toBe(TaintLevel.POSSIBLY_TAINTED);
      
      expect(TaintLattice.join(TaintLevel.LIKELY_TAINTED, TaintLevel.POSSIBLY_TAINTED))
        .toBe(TaintLevel.LIKELY_TAINTED);
      
      expect(TaintLattice.join(TaintLevel.HIGHLY_TAINTED, TaintLevel.CLEAN))
        .toBe(TaintLevel.HIGHLY_TAINTED);
    });

    it('同じレベルの場合はそのレベルを返すこと', () => {
      expect(TaintLattice.join(TaintLevel.POSSIBLY_TAINTED, TaintLevel.POSSIBLY_TAINTED))
        .toBe(TaintLevel.POSSIBLY_TAINTED);
    });
  });

  describe('meet演算', () => {
    it('より低い汚染レベルを選択すること', () => {
      expect(TaintLattice.meet(TaintLevel.CLEAN, TaintLevel.POSSIBLY_TAINTED))
        .toBe(TaintLevel.CLEAN);
      
      expect(TaintLattice.meet(TaintLevel.LIKELY_TAINTED, TaintLevel.POSSIBLY_TAINTED))
        .toBe(TaintLevel.POSSIBLY_TAINTED);
      
      expect(TaintLattice.meet(TaintLevel.HIGHLY_TAINTED, TaintLevel.CLEAN))
        .toBe(TaintLevel.CLEAN);
    });
  });

  describe('lessThanOrEqual', () => {
    it('偏順序関係を正しく判定すること', () => {
      expect(TaintLattice.lessThanOrEqual(TaintLevel.CLEAN, TaintLevel.POSSIBLY_TAINTED))
        .toBe(true);
      
      expect(TaintLattice.lessThanOrEqual(TaintLevel.POSSIBLY_TAINTED, TaintLevel.CLEAN))
        .toBe(false);
      
      expect(TaintLattice.lessThanOrEqual(TaintLevel.POSSIBLY_TAINTED, TaintLevel.POSSIBLY_TAINTED))
        .toBe(true);
    });
  });

  describe('height', () => {
    it('格子の高さを正しく返すこと', () => {
      expect(TaintLattice.height(TaintLevel.CLEAN)).toBe(0);
      expect(TaintLattice.height(TaintLevel.POSSIBLY_TAINTED)).toBe(1);
      expect(TaintLattice.height(TaintLevel.HIGHLY_TAINTED)).toBe(4);
    });
  });

  describe('applySanitizer', () => {
    it('HTMLエスケープとSQLエスケープは汚染を完全除去すること', () => {
      expect(TaintLattice.applySanitizer(TaintLevel.HIGHLY_TAINTED, SanitizerType.HTML_ESCAPE))
        .toBe(TaintLevel.UNTAINTED);
      
      expect(TaintLattice.applySanitizer(TaintLevel.LIKELY_TAINTED, SanitizerType.SQL_ESCAPE))
        .toBe(TaintLevel.UNTAINTED);
    });

    it('入力検証は汚染レベルを1下げること', () => {
      expect(TaintLattice.applySanitizer(TaintLevel.LIKELY_TAINTED, SanitizerType.INPUT_VALIDATION))
        .toBe(TaintLevel.POSSIBLY_TAINTED);
      
      expect(TaintLattice.applySanitizer(TaintLevel.POSSIBLY_TAINTED, SanitizerType.INPUT_VALIDATION))
        .toBe(TaintLevel.UNTAINTED);
    });

    it('型変換は部分的な効果を持つこと', () => {
      expect(TaintLattice.applySanitizer(TaintLevel.HIGHLY_TAINTED, SanitizerType.TYPE_CONVERSION))
        .toBe(TaintLevel.POSSIBLY_TAINTED);
      
      expect(TaintLattice.applySanitizer(TaintLevel.POSSIBLY_TAINTED, SanitizerType.TYPE_CONVERSION))
        .toBe(TaintLevel.UNTAINTED);
    });

    it('不明なサニタイザーは元のレベルを保持すること', () => {
      expect(TaintLattice.applySanitizer(TaintLevel.HIGHLY_TAINTED, 'unknown' as SanitizerType))
        .toBe(TaintLevel.HIGHLY_TAINTED);
    });
  });

  describe('toString', () => {
    it('汚染レベルを可視化できること', () => {
      expect(TaintLattice.toString(TaintLevel.UNTAINTED)).toBe('⊥ (安全)');
      expect(TaintLattice.toString(TaintLevel.POSSIBLY_TAINTED)).toBe('? (要検証)');
      expect(TaintLattice.toString(TaintLevel.LIKELY_TAINTED)).toBe('! (注意)');
      expect(TaintLattice.toString(TaintLevel.DEFINITELY_TAINTED)).toBe('⊤ (危険)');
      expect(TaintLattice.toString(TaintLevel.HIGHLY_TAINTED)).toBe('⊤⊤ (最高危険度)');
    });
  });

  describe('isBottom と isTop', () => {
    it('底と頂を正しく判定すること', () => {
      const lattice = new TaintLattice();
      expect(lattice.isBottom(TaintLevel.CLEAN)).toBe(true);
      expect(lattice.isBottom(TaintLevel.POSSIBLY_TAINTED)).toBe(false);
      
      expect(lattice.isTop(TaintLevel.HIGHLY_TAINTED)).toBe(true);
      expect(lattice.isTop(TaintLevel.DEFINITELY_TAINTED)).toBe(false);
    });
  });
});

describe('TaintedValue', () => {
  it('汚染値を正しく作成できること', () => {
    const taintedValue = new TaintedValue('user input', TaintLevel.LIKELY_TAINTED, TaintSource.USER_INPUT);
    
    expect(taintedValue.value).toBe('user input');
    expect(taintedValue.taintLevel).toBe(TaintLevel.LIKELY_TAINTED);
    expect(taintedValue.source).toBe(TaintSource.USER_INPUT);
  });

  describe('combine', () => {
    it('複数の汚染値を結合できること', () => {
      const value1 = new TaintedValue('hello', TaintLevel.POSSIBLY_TAINTED, TaintSource.USER_INPUT);
      const value2 = new TaintedValue(' world', TaintLevel.LIKELY_TAINTED, TaintSource.EXTERNAL_API);
      
      const combined = TaintedValue.combine(value1, value2);
      
      expect(combined.value).toBe('hello world');
      expect(combined.taintLevel).toBe(TaintLevel.LIKELY_TAINTED);
      expect(combined.source).toBe(TaintSource.EXTERNAL_API);
    });

    it('同じレベルの場合は最初の汚染源を保持すること', () => {
      const value1 = new TaintedValue('a', TaintLevel.POSSIBLY_TAINTED, TaintSource.USER_INPUT);
      const value2 = new TaintedValue('b', TaintLevel.POSSIBLY_TAINTED, TaintSource.DATABASE);
      
      const combined = TaintedValue.combine(value1, value2);
      
      expect(combined.source).toBe(TaintSource.USER_INPUT);
    });
  });
});

describe('Sanitizer', () => {
  it('HTML文字列をサニタイズできること', () => {
    const sanitizer = new Sanitizer(SanitizerType.HTML_ESCAPE);
    const taintedValue = new TaintedValue('<script>alert("xss")</script>', TaintLevel.HIGHLY_TAINTED, TaintSource.USER_INPUT);
    
    const sanitized = sanitizer.sanitize(taintedValue);
    
    expect(sanitized.value).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    expect(sanitized.taintLevel).toBe(TaintLevel.UNTAINTED);
    expect(sanitized.source).toBe(TaintSource.USER_INPUT);
  });

  it('効果率が100%未満の場合は部分的な効果を適用すること', () => {
    const weakSanitizer = new Sanitizer(SanitizerType.HTML_ESCAPE, 0.8);
    const taintedValue = new TaintedValue('input', TaintLevel.HIGHLY_TAINTED, TaintSource.USER_INPUT);
    
    const sanitized = weakSanitizer.sanitize(taintedValue);
    
    expect(sanitized.taintLevel).toBe(TaintLevel.POSSIBLY_TAINTED);
  });
});

describe('TaintPropagation', () => {
  it('操作による汚染の伝播を追跡できること', () => {
    const values = [
      new TaintedValue('a', TaintLevel.CLEAN, null),
      new TaintedValue('b', TaintLevel.POSSIBLY_TAINTED, TaintSource.USER_INPUT),
      new TaintedValue('c', TaintLevel.LIKELY_TAINTED, TaintSource.DATABASE)
    ];
    
    const result = TaintPropagation.propagate('concat', values);
    
    expect(result.value).toBe('abc');
    expect(result.taintLevel).toBe(TaintLevel.LIKELY_TAINTED);
    expect(result.source).toBe(TaintSource.DATABASE);
  });

  it('空の配列の場合はクリーンな値を返すこと', () => {
    const result = TaintPropagation.propagate('concat', []);
    
    expect(result.value).toBe('');
    expect(result.taintLevel).toBe(TaintLevel.CLEAN);
    expect(result.source).toBeNull();
  });
});

describe('TaintAnalyzer', () => {
  const analyzer = new TaintAnalyzer();

  describe('analyzeFunction', () => {
    it('汚染源を検出できること', () => {
      const code = 'function process(userInput) { return userInput; }';
      const result = analyzer.analyzeFunction(code);
      
      expect(result.taintSources).toHaveLength(1);
      expect(result.taintSources[0].name).toBe('userInput');
    });

    it('サニタイザーを検出できること', () => {
      const code = 'function safe(input) { return escapeHtml(input); }';
      const result = analyzer.analyzeFunction(code);
      
      expect(result.sanitizers).toHaveLength(1);
      expect(result.sanitizers[0].name).toBe('escapeHtml');
    });

    it('汚染フローを追跡できること', () => {
      const code = 'function process(userInput) { return escapeHtml(userInput); }';
      const result = analyzer.analyzeFunction(code);
      
      expect(result.taintFlow).toHaveLength(1);
      expect(result.taintFlow[0].from).toBe('userInput');
      expect(result.taintFlow[0].to).toBe('escapeHtml');
      expect(result.taintFlow[0].level).toBe(TaintLevel.POSSIBLY_TAINTED);
    });
  });

  describe('detectViolations', () => {
    it('evalの使用を検出できること', () => {
      const code = 'eval(userInput);';
      const violations = analyzer.detectViolations(code);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe('taint-violation');
      expect(violations[0].severity).toBe('critical');
      expect(violations[0].message).toContain('汚染データの直接実行は危険です');
    });

    it('安全なコードでは違反を検出しないこと', () => {
      const code = 'console.log(escapeHtml(userInput));';
      const violations = analyzer.detectViolations(code);
      
      expect(violations).toHaveLength(0);
    });
  });
});

describe('TaintTypeInference', () => {
  const inference = new TaintTypeInference();

  it('型注釈から汚染情報を推論できること', () => {
    const annotation = '@taint(level=HIGH, source=USER_INPUT)';
    const result = inference.inferFromAnnotation(annotation);
    
    expect(result.level).toBe('HIGH');
    expect(result.source).toBe('USER_INPUT');
  });

  it('不完全な注釈の場合はUNKNOWNを返すこと', () => {
    const annotation = '@taint()';
    const result = inference.inferFromAnnotation(annotation);
    
    expect(result.level).toBe('UNKNOWN');
    expect(result.source).toBe('UNKNOWN');
  });
});

describe('TaintTypeChecker', () => {
  const checker = new TaintTypeChecker();

  it('安全な代入を許可すること', () => {
    // クリーンな値をクリーンな変数に代入
    expect(checker.isAssignmentSafe(TaintLevel.CLEAN, TaintLevel.CLEAN)).toBe(true);
    
    // クリーンな値を汚染された変数に代入
    expect(checker.isAssignmentSafe(TaintLevel.CLEAN, TaintLevel.POSSIBLY_TAINTED)).toBe(true);
  });

  it('危険な代入を禁止すること', () => {
    // 汚染された値をクリーンな変数に代入
    expect(checker.isAssignmentSafe(TaintLevel.POSSIBLY_TAINTED, TaintLevel.CLEAN)).toBe(false);
    
    // 高度に汚染された値を低レベル汚染変数に代入
    expect(checker.isAssignmentSafe(TaintLevel.HIGHLY_TAINTED, TaintLevel.POSSIBLY_TAINTED)).toBe(false);
  });
});

describe('ユーティリティ関数', () => {
  describe('compareTaintLevels', () => {
    it('汚染レベルを正しく比較できること', () => {
      expect(compareTaintLevels(TaintLevel.CLEAN, TaintLevel.POSSIBLY_TAINTED)).toBeLessThan(0);
      expect(compareTaintLevels(TaintLevel.POSSIBLY_TAINTED, TaintLevel.CLEAN)).toBeGreaterThan(0);
      expect(compareTaintLevels(TaintLevel.POSSIBLY_TAINTED, TaintLevel.POSSIBLY_TAINTED)).toBe(0);
    });
  });

  describe('getTaintSourceRisk', () => {
    it('汚染源の危険度を正しく評価できること', () => {
      expect(getTaintSourceRisk(TaintSource.USER_INPUT)).toBe('high');
      expect(getTaintSourceRisk(TaintSource.EXTERNAL_API)).toBe('high');
      expect(getTaintSourceRisk(TaintSource.NETWORK)).toBe('high');
      
      expect(getTaintSourceRisk(TaintSource.DATABASE)).toBe('medium');
      expect(getTaintSourceRisk(TaintSource.FILE_SYSTEM)).toBe('medium');
      
      expect(getTaintSourceRisk(TaintSource.ENVIRONMENT)).toBe('low');
    });
  });
});

describe('型定義のテスト', () => {
  it('TaintMetadataインターフェースが正しく定義されていること', () => {
    const metadata: TaintMetadata = {
      source: TaintSource.USER_INPUT,
      confidence: 0.95,
      location: {
        file: 'test.ts',
        line: 10,
        column: 5
      },
      tracePath: [],
      securityRules: ['no-eval', 'no-innerHTML']
    };
    
    expect(metadata.source).toBe(TaintSource.USER_INPUT);
    expect(metadata.confidence).toBe(0.95);
  });

  it('TaintTraceStepインターフェースが正しく定義されていること', () => {
    const step: TaintTraceStep = {
      type: 'propagate',
      description: 'String concatenation',
      inputTaint: TaintLevel.POSSIBLY_TAINTED,
      outputTaint: TaintLevel.LIKELY_TAINTED,
      location: {
        file: 'concat.ts',
        line: 20,
        column: 10
      }
    };
    
    expect(step.type).toBe('propagate');
    expect(step.inputTaint).toBe(TaintLevel.POSSIBLY_TAINTED);
  });
});