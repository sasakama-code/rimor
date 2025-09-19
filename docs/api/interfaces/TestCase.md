[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestCase

# Interface: TestCase

Defined in: [testing/index.ts:229](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L229)

統一されたテストケース型
DRY原則: 既存のインターフェースを組み合わせて定義

## Extends

- [`BaseTestCase`](BaseTestCase.md).[`TestCaseWithIO`](TestCaseWithIO.md).[`TestCaseWithMetadata`](TestCaseWithMetadata.md).[`TestCaseWithAssertions`](TestCaseWithAssertions.md).[`TestCaseWithQuality`](TestCaseWithQuality.md)

## Properties

### actualOutput?

> `optional` **actualOutput**: `unknown`

Defined in: [testing/index.ts:68](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L68)

実際の出力

#### Inherited from

[`TestCaseWithIO`](TestCaseWithIO.md).[`actualOutput`](TestCaseWithIO.md#actualoutput)

***

### assertions?

> `optional` **assertions**: [`Assertion`](Assertion.md)[]

Defined in: [testing/index.ts:125](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L125)

アサーションのリスト

#### Inherited from

[`TestCaseWithAssertions`](TestCaseWithAssertions.md).[`assertions`](TestCaseWithAssertions.md#assertions)

***

### assertionSummary?

> `optional` **assertionSummary**: `object`

Defined in: [testing/index.ts:127](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L127)

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

Defined in: [testing/index.ts:54](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L54)

テストの説明（オプション）

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`description`](BaseTestCase.md#description)

***

### error?

> `optional` **error**: `object`

Defined in: [testing/index.ts:70](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L70)

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

> `optional` **expectedOutput**: `unknown`

Defined in: [testing/index.ts:66](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L66)

期待される出力

#### Inherited from

[`TestCaseWithIO`](TestCaseWithIO.md).[`expectedOutput`](TestCaseWithIO.md#expectedoutput)

***

### filePath?

> `optional` **filePath**: `string`

Defined in: [testing/index.ts:238](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L238)

所属するファイルパス（オプション）

***

### id

> **id**: `string`

Defined in: [testing/index.ts:50](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L50)

テストケースの一意識別子

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`id`](BaseTestCase.md#id)

***

### input?

> `optional` **input**: `unknown`

Defined in: [testing/index.ts:64](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L64)

テストの入力データ

#### Inherited from

[`TestCaseWithIO`](TestCaseWithIO.md).[`input`](TestCaseWithIO.md#input)

***

### metadata?

> `optional` **metadata**: `object`

Defined in: [testing/index.ts:82](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L82)

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

Defined in: [testing/index.ts:52](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L52)

テストケース名

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`name`](BaseTestCase.md#name)

***

### pluginData?

> `optional` **pluginData**: `Record`\<`string`, `any`\>

Defined in: [testing/index.ts:240](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L240)

プラグイン固有の情報（オプション）

***

### qualityMetrics?

> `optional` **qualityMetrics**: `object`

Defined in: [testing/index.ts:160](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L160)

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

Defined in: [testing/index.ts:56](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L56)

テストのステータス

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`status`](BaseTestCase.md#status)

***

### suiteId?

> `optional` **suiteId**: `string`

Defined in: [testing/index.ts:236](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L236)

所属するスイートID（オプション）
