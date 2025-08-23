[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / BaseAnalysisResult

# Interface: BaseAnalysisResult

Defined in: analysis/index.ts:16

分析結果の基本インターフェース
すべての分析結果型の基底となる最小限の構造

KISS原則: シンプルで必要最小限のフィールドのみ

## Extended by

- [`AnalysisResult`](AnalysisResult.md)
- [`AnalysisResultWithParallelStats`](AnalysisResultWithParallelStats.md)
- [`FileAnalysisResult`](FileAnalysisResult.md)

## Properties

### executionTime

> **executionTime**: `number`

Defined in: analysis/index.ts:24

実行時間（ミリ秒）

***

### issues

> **issues**: `Issue`[]

Defined in: analysis/index.ts:21

検出された問題のリスト

***

### totalFiles

> **totalFiles**: `number`

Defined in: analysis/index.ts:18

分析されたファイル数
