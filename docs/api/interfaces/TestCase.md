[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestCase

# Interface: TestCase

Defined in: testing/index.ts:219

統一されたテストケース型
DRY原則: 既存のインターフェースを組み合わせて定義

## Extends

- [`BaseTestCase`](BaseTestCase.md).[`TestCaseWithIO`](TestCaseWithIO.md).[`TestCaseWithMetadata`](TestCaseWithMetadata.md).[`TestCaseWithAssertions`](TestCaseWithAssertions.md).[`TestCaseWithQuality`](TestCaseWithQuality.md)

## Properties

### actualOutput?

> `optional` **actualOutput**: `any`

Defined in: testing/index.ts:58

実際の出力

#### Inherited from

[`TestCaseWithIO`](TestCaseWithIO.md).[`actualOutput`](TestCaseWithIO.md#actualoutput)

***

### assertions?

> `optional` **assertions**: [`Assertion`](Assertion.md)[]

Defined in: testing/index.ts:115

アサーションのリスト

#### Inherited from

[`TestCaseWithAssertions`](TestCaseWithAssertions.md).[`assertions`](TestCaseWithAssertions.md#assertions)

***

### assertionSummary?

> `optional` **assertionSummary**: `object`

Defined in: testing/index.ts:117

アサーション数のサマリー

#### failed

> **failed**: `number`

#### passed

> **passed**: `number`

#### total

> **total**: `number`

#### Inherited from

[`TestCaseWithAssertions`](TestCaseWithAssertions.md).[`assertionSummary`](TestCaseWithAssertions.md#assertionsummary)

***

### description?

> `optional` **description**: `string`

Defined in: testing/index.ts:44

テストの説明（オプション）

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`description`](BaseTestCase.md#description)

***

### error?

> `optional` **error**: `object`

Defined in: testing/index.ts:60

エラー情報（失敗時）

#### code?

> `optional` **code**: `string`

#### message

> **message**: `string`

#### stack?

> `optional` **stack**: `string`

#### Inherited from

[`TestCaseWithIO`](TestCaseWithIO.md).[`error`](TestCaseWithIO.md#error)

***

### expectedOutput?

> `optional` **expectedOutput**: `any`

Defined in: testing/index.ts:56

期待される出力

#### Inherited from

[`TestCaseWithIO`](TestCaseWithIO.md).[`expectedOutput`](TestCaseWithIO.md#expectedoutput)

***

### filePath?

> `optional` **filePath**: `string`

Defined in: testing/index.ts:228

所属するファイルパス（オプション）

***

### id

> **id**: `string`

Defined in: testing/index.ts:40

テストケースの一意識別子

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`id`](BaseTestCase.md#id)

***

### input?

> `optional` **input**: `any`

Defined in: testing/index.ts:54

テストの入力データ

#### Inherited from

[`TestCaseWithIO`](TestCaseWithIO.md).[`input`](TestCaseWithIO.md#input)

***

### metadata?

> `optional` **metadata**: `object`

Defined in: testing/index.ts:72

テスト実行のメタデータ

#### endTime?

> `optional` **endTime**: `string`

終了時刻

#### executionTime?

> `optional` **executionTime**: `number`

実行時間（ミリ秒）

#### priority?

> `optional` **priority**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

優先度

#### retryCount?

> `optional` **retryCount**: `number`

リトライ回数

#### startTime?

> `optional` **startTime**: `string`

開始時刻

#### tags?

> `optional` **tags**: `string`[]

タグ

#### Inherited from

[`TestCaseWithMetadata`](TestCaseWithMetadata.md).[`metadata`](TestCaseWithMetadata.md#metadata)

***

### name

> **name**: `string`

Defined in: testing/index.ts:42

テストケース名

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`name`](BaseTestCase.md#name)

***

### pluginData?

> `optional` **pluginData**: `Record`\<`string`, `any`\>

Defined in: testing/index.ts:230

プラグイン固有の情報（オプション）

***

### qualityMetrics?

> `optional` **qualityMetrics**: `object`

Defined in: testing/index.ts:150

品質メトリクス

#### assertionDensity?

> `optional` **assertionDensity**: `number`

アサーション密度（アサーション数/コード行数）

#### complexity?

> `optional` **complexity**: `number`

複雑度

#### testCoverage?

> `optional` **testCoverage**: `number`

テストカバレッジ（パーセント）

#### testMaintainability?

> `optional` **testMaintainability**: `number`

保守性スコア（0-100）

#### testReliability?

> `optional` **testReliability**: `number`

信頼性スコア（0-100）

#### Inherited from

[`TestCaseWithQuality`](TestCaseWithQuality.md).[`qualityMetrics`](TestCaseWithQuality.md#qualitymetrics)

***

### status

> **status**: [`TestStatus`](../type-aliases/TestStatus.md)

Defined in: testing/index.ts:46

テストのステータス

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`status`](BaseTestCase.md#status)

***

### suiteId?

> `optional` **suiteId**: `string`

Defined in: testing/index.ts:226

所属するスイートID（オプション）
