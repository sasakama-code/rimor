[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaintSummary

# Interface: TaintSummary

Defined in: [security/index.ts:35](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L35)

Taint分析のサマリー情報

## Properties

### coverage?

> `optional` **coverage**: `number`

Defined in: [security/index.ts:44](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L44)

分析のカバレッジ（オプション）

***

### criticalFlows

> **criticalFlows**: `number`

Defined in: [security/index.ts:39](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L39)

深刻度別のフロー数

***

### falsePositiveRate?

> `optional` **falsePositiveRate**: `number`

Defined in: [security/index.ts:46](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L46)

誤検知率（オプション）

***

### highRiskFlows

> **highRiskFlows**: `number`

Defined in: [security/index.ts:40](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L40)

***

### lowRiskFlows

> **lowRiskFlows**: `number`

Defined in: [security/index.ts:42](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L42)

***

### mediumRiskFlows

> **mediumRiskFlows**: `number`

Defined in: [security/index.ts:41](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L41)

***

### totalFlows

> **totalFlows**: `number`

Defined in: [security/index.ts:37](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L37)

検出されたフローの総数
