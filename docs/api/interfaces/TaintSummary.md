[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaintSummary

# Interface: TaintSummary

Defined in: security/index.ts:35

Taint分析のサマリー情報

## Properties

### coverage?

> `optional` **coverage**: `number`

Defined in: security/index.ts:44

分析のカバレッジ（オプション）

***

### criticalFlows

> **criticalFlows**: `number`

Defined in: security/index.ts:39

深刻度別のフロー数

***

### falsePositiveRate?

> `optional` **falsePositiveRate**: `number`

Defined in: security/index.ts:46

誤検知率（オプション）

***

### highRiskFlows

> **highRiskFlows**: `number`

Defined in: security/index.ts:40

***

### lowRiskFlows

> **lowRiskFlows**: `number`

Defined in: security/index.ts:42

***

### mediumRiskFlows

> **mediumRiskFlows**: `number`

Defined in: security/index.ts:41

***

### totalFlows

> **totalFlows**: `number`

Defined in: security/index.ts:37

検出されたフローの総数
