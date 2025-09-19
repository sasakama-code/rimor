[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AISummary

# Interface: AISummary

Defined in: [ai/index.ts:54](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L54)

AI分析のサマリー情報
SRP: サマリー情報の表現に特化

## Example

```typescript
const summary: AISummary = {
  totalIssues: 15,
  totalFiles: 5,
  overallScore: 85.5,
  severityDistribution: { 'HIGH': 2, 'MEDIUM': 8, 'LOW': 5 },
  categoryDistribution: { 'security': 3, 'performance': 7, 'maintainability': 5 },
  topIssues: [
    { category: 'security', severity: 'HIGH', count: 2, message: 'SQL injection vulnerability' }
  ],
  keyFindings: ['Critical security issues detected', 'Performance optimizations needed']
};
```

## Properties

### categoryDistribution

> **categoryDistribution**: `Record`\<`string`, `number`\>

Defined in: [ai/index.ts:64](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L64)

カテゴリ別の分布

***

### keyFindings

> **keyFindings**: `string`[]

Defined in: [ai/index.ts:73](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L73)

主要な発見事項

***

### overallScore

> **overallScore**: `number`

Defined in: [ai/index.ts:60](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L60)

全体スコア

***

### severityDistribution

> **severityDistribution**: `Record`\<`string`, `number`\>

Defined in: [ai/index.ts:62](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L62)

深刻度別の分布

***

### topIssues

> **topIssues**: `object`[]

Defined in: [ai/index.ts:66](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L66)

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

Defined in: [ai/index.ts:58](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L58)

総ファイル数

***

### totalIssues

> **totalIssues**: `number`

Defined in: [ai/index.ts:56](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L56)

総問題数
