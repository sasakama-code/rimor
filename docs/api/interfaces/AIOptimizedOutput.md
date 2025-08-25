[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AIOptimizedOutput

# Interface: AIOptimizedOutput

Defined in: ai/index.ts:285

AI最適化出力
DRY原則: 既存の型を組み合わせて定義

## Properties

### actionableRisks?

> `optional` **actionableRisks**: [`AIActionableRisk`](AIActionableRisk.md)[]

Defined in: ai/index.ts:330

アクション可能なリスク

***

### context

> **context**: `object`

Defined in: ai/index.ts:299

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

Defined in: ai/index.ts:313

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

Defined in: ai/index.ts:289

フォーマット

***

### metadata

> **metadata**: `object`

Defined in: ai/index.ts:291

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

Defined in: ai/index.ts:306

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

Defined in: ai/index.ts:328

サマリー

***

### version

> **version**: `string`

Defined in: ai/index.ts:287

バージョン
