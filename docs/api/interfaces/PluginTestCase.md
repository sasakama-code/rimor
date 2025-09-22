[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / PluginTestCase

# Interface: PluginTestCase

Defined in: [testing/index.ts:137](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L137)

プラグイン拡張を持つテストケース

## Extends

- [`BaseTestCase`](BaseTestCase.md)

## Properties

### description?

> `optional` **description**: `string`

Defined in: [testing/index.ts:54](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L54)

テストの説明（オプション）

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`description`](BaseTestCase.md#description)

***

### id

> **id**: `string`

Defined in: [testing/index.ts:50](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L50)

テストケースの一意識別子

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`id`](BaseTestCase.md#id)

***

### name

> **name**: `string`

Defined in: [testing/index.ts:52](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L52)

テストケース名

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`name`](BaseTestCase.md#name)

***

### pluginConfig?

> `optional` **pluginConfig**: `object`

Defined in: [testing/index.ts:141](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L141)

プラグイン固有の設定

#### Index Signature

\[`key`: `string`\]: `unknown`

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

Defined in: [testing/index.ts:139](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L139)

プラグイン名

***

### status

> **status**: [`TestStatus`](../type-aliases/TestStatus.md)

Defined in: [testing/index.ts:56](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L56)

テストのステータス

#### Inherited from

[`BaseTestCase`](BaseTestCase.md).[`status`](BaseTestCase.md#status)
