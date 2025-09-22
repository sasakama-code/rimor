[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AIOptimizedOutput

# Interface: AIOptimizedOutput

Defined in: [ai/index.ts:303](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L303)

AI最適化出力
DRY原則: 既存の型を組み合わせて定義

## Properties

### actionableRisks?

> `optional` **actionableRisks**: [`AIActionableRisk`](AIActionableRisk.md)[]

Defined in: [ai/index.ts:348](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L348)

アクション可能なリスク

***

### context

> **context**: `object`

Defined in: [ai/index.ts:317](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L317)

コンテキスト

#### configFiles

> **configFiles**: `Record`\<`string`, `string`\>

#### dependencies

> **dependencies**: `Record`\<`string`, `string`\>

#### projectStructure

> **projectStructure**: `string`

#### rootPath

> **rootPath**: `string`

***

### files

> **files**: `object`[]

Defined in: [ai/index.ts:331](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L331)

ファイル情報

#### issues

> **issues**: `object`[]

#### language

> **language**: `string`

#### path

> **path**: `string`

#### score

> **score**: `number`

***

### format

> **format**: `"ai-optimized"`

Defined in: [ai/index.ts:307](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L307)

フォーマット

***

### metadata

> **metadata**: `object`

Defined in: [ai/index.ts:309](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L309)

メタデータ

#### language

> **language**: `string`

#### projectType

> **projectType**: `string`

#### rimVersion

> **rimVersion**: `string`

#### testFramework

> **testFramework**: `string`

#### timestamp

> **timestamp**: `string`

***

### qualityOverview

> **qualityOverview**: `object`

Defined in: [ai/index.ts:324](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L324)

品質概要

#### criticalIssues

> **criticalIssues**: `number`

#### projectGrade

> **projectGrade**: `string`

#### projectScore

> **projectScore**: `number`

#### totalIssues

> **totalIssues**: `number`

***

### summary

> **summary**: [`AISummary`](AISummary.md)

Defined in: [ai/index.ts:346](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L346)

サマリー

***

### version

> **version**: `string`

Defined in: [ai/index.ts:305](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L305)

バージョン
