[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / BaseTaintAnalysisResult

# Interface: BaseTaintAnalysisResult

Defined in: security/index.ts:121

Taint分析の基本結果
SRP（単一責任原則）: Taint分析の核心機能のみ

## Extended by

- [`TaintAnalysisResult`](TaintAnalysisResult.md)

## Properties

### flows

> **flows**: [`TaintFlow`](TaintFlow.md)[]

Defined in: security/index.ts:123

検出されたTaintフロー

***

### recommendations

> **recommendations**: `string`[]

Defined in: security/index.ts:127

推奨事項

***

### summary

> **summary**: [`TaintSummary`](TaintSummary.md)

Defined in: security/index.ts:125

分析サマリー
