[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / BaseTaintAnalysisResult

# Interface: BaseTaintAnalysisResult

Defined in: [security/index.ts:121](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L121)

Taint分析の基本結果
SRP（単一責任原則）: Taint分析の核心機能のみ

## Extended by

- [`TaintAnalysisResult`](TaintAnalysisResult.md)

## Properties

### flows

> **flows**: [`TaintFlow`](TaintFlow.md)[]

Defined in: [security/index.ts:123](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L123)

検出されたTaintフロー

***

### recommendations

> **recommendations**: `string`[]

Defined in: [security/index.ts:127](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L127)

推奨事項

***

### summary

> **summary**: [`TaintSummary`](TaintSummary.md)

Defined in: [security/index.ts:125](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L125)

分析サマリー
