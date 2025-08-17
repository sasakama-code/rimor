[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / PluginTestCase

# Interface: PluginTestCase

Defined in: testing/index.ts:127

プラグイン拡張を持つテストケース

## Extends

- [`BaseTestCase`](BaseTestCase.md)

## Properties

### description?

> `optional` **description**: `string`

Defined in: testing/index.ts:44

テストの説明（オプション）

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`description`](BaseTestCase.md#description)

***

### id

> **id**: `string`

Defined in: testing/index.ts:40

テストケースの一意識別子

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`id`](BaseTestCase.md#id)

***

### name

> **name**: `string`

Defined in: testing/index.ts:42

テストケース名

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`name`](BaseTestCase.md#name)

***

### pluginConfig?

> `optional` **pluginConfig**: `object`

Defined in: testing/index.ts:131

プラグイン固有の設定

#### Index Signature

\[`key`: `string`\]: `any`

その他のプラグイン固有設定

#### priority?

> `optional` **priority**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

優先度

#### retries?

> `optional` **retries**: `number`

リトライ回数

#### tags?

> `optional` **tags**: `string`[]

タグ

#### timeout?

> `optional` **timeout**: `number`

タイムアウト（ミリ秒）

***

### pluginName

> **pluginName**: `string`

Defined in: testing/index.ts:129

プラグイン名

***

### status

> **status**: [`TestStatus`](../type-aliases/TestStatus.md)

Defined in: testing/index.ts:46

テストのステータス

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`status`](BaseTestCase.md#status)
