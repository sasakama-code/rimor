[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AISummary

# Interface: AISummary

Defined in: ai/index.ts:36

AI分析のサマリー情報
SRP: サマリー情報の表現に特化

## Properties

### categoryDistribution

> **categoryDistribution**: `Record`\<`string`, `number`\>

Defined in: ai/index.ts:46

カテゴリ別の分布

***

### keyFindings

> **keyFindings**: `string`[]

Defined in: ai/index.ts:55

主要な発見事項

***

### overallScore

> **overallScore**: `number`

Defined in: ai/index.ts:42

全体スコア

***

### severityDistribution

> **severityDistribution**: `Record`\<`string`, `number`\>

Defined in: ai/index.ts:44

深刻度別の分布

***

### topIssues

> **topIssues**: `object`[]

Defined in: ai/index.ts:48

主要な問題

#### category

> **category**: `string`

#### count

> **count**: `number`

#### message

> **message**: `string`

#### severity

> **severity**: `string`

***

### totalFiles

> **totalFiles**: `number`

Defined in: ai/index.ts:40

総ファイル数

***

### totalIssues

> **totalIssues**: `number`

Defined in: ai/index.ts:38

総問題数
