[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / BaseAnalysisResult

# Interface: BaseAnalysisResult

Defined in: [analysis/index.ts:25](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L25)

分析結果の基本インターフェース
すべての分析結果型の基底となる最小限の構造

KISS原則: シンプルで必要最小限のフィールドのみ

## Example

```typescript
const result: BaseAnalysisResult = {
  totalFiles: 10,
  issues: [],
  executionTime: 1500
};
```

## Extended by

- [`AnalysisResult`](AnalysisResult.md)
- [`AnalysisResultWithParallelStats`](AnalysisResultWithParallelStats.md)
- [`FileAnalysisResult`](FileAnalysisResult.md)

## Properties

### executionTime

> **executionTime**: `number`

Defined in: [analysis/index.ts:33](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L33)

実行時間（ミリ秒）

***

### issues

> **issues**: `Issue`[]

Defined in: [analysis/index.ts:30](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L30)

検出された問題のリスト

***

### totalFiles

> **totalFiles**: `number`

Defined in: [analysis/index.ts:27](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L27)

分析されたファイル数
