[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaintAnalysisResult

# Interface: TaintAnalysisResult

Defined in: security/index.ts:200

統一されたTaint分析結果型
DRY原則: 既存のインターフェースを組み合わせて定義

## Extends

- [`BaseTaintAnalysisResult`](BaseTaintAnalysisResult.md).[`TaintAnalysisWithAnnotations`](TaintAnalysisWithAnnotations.md).[`TaintAnalysisWithViolations`](TaintAnalysisWithViolations.md).[`TaintAnalysisWithImprovements`](TaintAnalysisWithImprovements.md).[`TaintAnalysisWithMetrics`](TaintAnalysisWithMetrics.md)

## Properties

### annotations?

> `optional` **annotations**: `object`

Defined in: security/index.ts:135

アノテーション情報

#### errors?

> `optional` **errors**: `object`[]

アノテーションエラー

#### polyTaintMethods

> **polyTaintMethods**: `string`[]

PolyTaintメソッド

#### suppressedMethods

> **suppressedMethods**: `string`[]

抑制されたメソッド

#### taintedProperties

> **taintedProperties**: `string`[]

汚染されたプロパティ

#### untaintedProperties

> **untaintedProperties**: `string`[]

安全なプロパティ

#### Inherited from

[`TaintAnalysisWithAnnotations`](TaintAnalysisWithAnnotations.md).[`annotations`](TaintAnalysisWithAnnotations.md#annotations)

***

### flows

> **flows**: [`TaintFlow`](TaintFlow.md)[]

Defined in: security/index.ts:123

検出されたTaintフロー

#### Inherited from

[`BaseTaintAnalysisResult`](BaseTaintAnalysisResult.md).[`flows`](BaseTaintAnalysisResult.md#flows)

***

### improvements

> **improvements**: [`SecurityImprovement`](SecurityImprovement.md)[]

Defined in: security/index.ts:172

セキュリティ改善提案

#### Inherited from

[`TaintAnalysisWithImprovements`](TaintAnalysisWithImprovements.md).[`improvements`](TaintAnalysisWithImprovements.md#improvements)

***

### metadata?

> `optional` **metadata**: `object`

Defined in: security/index.ts:207

分析のメタデータ（オプション）

#### configuration?

> `optional` **configuration**: `Record`\<`string`, `any`\>

分析設定

#### engineVersion?

> `optional` **engineVersion**: `string`

分析エンジンのバージョン

#### timestamp?

> `optional` **timestamp**: `string`

分析日時

***

### metrics

> **metrics**: `object`

Defined in: security/index.ts:180

分析メトリクス

#### analysisTime

> **analysisTime**: `number`

分析時間（ミリ秒）

#### coverage

> **coverage**: `number`

カバレッジ（パーセント）

#### falsePositiveRate?

> `optional` **falsePositiveRate**: `number`

誤検知率（パーセント）

#### filesAnalyzed

> **filesAnalyzed**: `number`

分析されたファイル数

#### memoryUsage?

> `optional` **memoryUsage**: `number`

メモリ使用量（MB）

#### methodsAnalyzed

> **methodsAnalyzed**: `number`

分析されたメソッド数

#### Inherited from

[`TaintAnalysisWithMetrics`](TaintAnalysisWithMetrics.md).[`metrics`](TaintAnalysisWithMetrics.md#metrics)

***

### recommendations

> **recommendations**: `string`[]

Defined in: security/index.ts:127

推奨事項

#### Inherited from

[`BaseTaintAnalysisResult`](BaseTaintAnalysisResult.md).[`recommendations`](BaseTaintAnalysisResult.md#recommendations)

***

### summary

> **summary**: [`TaintSummary`](TaintSummary.md)

Defined in: security/index.ts:125

分析サマリー

#### Inherited from

[`BaseTaintAnalysisResult`](BaseTaintAnalysisResult.md).[`summary`](BaseTaintAnalysisResult.md#summary)

***

### taintPaths?

> `optional` **taintPaths**: `object`[]

Defined in: security/index.ts:160

違反パス

#### from

> **from**: `string`

#### through

> **through**: `string`[]

#### to

> **to**: `string`

#### Inherited from

[`TaintAnalysisWithViolations`](TaintAnalysisWithViolations.md).[`taintPaths`](TaintAnalysisWithViolations.md#taintpaths)

***

### violations

> **violations**: [`SecurityViolation`](SecurityViolation.md)[]

Defined in: security/index.ts:158

セキュリティ違反のリスト

#### Inherited from

[`TaintAnalysisWithViolations`](TaintAnalysisWithViolations.md).[`violations`](TaintAnalysisWithViolations.md#violations)
