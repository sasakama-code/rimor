[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / PluginContext

# Interface: PluginContext

Defined in: [plugins/index.ts:77](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L77)

プラグインコンテキスト

## Properties

### cache?

> `optional` **cache**: `Map`\<`string`, `any`\>

Defined in: [plugins/index.ts:90](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L90)

キャッシュ

***

### config

> **config**: [`PluginConfig`](PluginConfig.md)

Defined in: [plugins/index.ts:81](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L81)

設定

***

### logger?

> `optional` **logger**: `object`

Defined in: [plugins/index.ts:83](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L83)

ロガー

#### debug()

> **debug**: (`message`) => `void`

##### Parameters

###### message

`string`

##### Returns

`void`

#### error()

> **error**: (`message`) => `void`

##### Parameters

###### message

`string`

##### Returns

`void`

#### info()

> **info**: (`message`) => `void`

##### Parameters

###### message

`string`

##### Returns

`void`

#### warn()

> **warn**: (`message`) => `void`

##### Parameters

###### message

`string`

##### Returns

`void`

***

### metrics?

> `optional` **metrics**: `object`

Defined in: [plugins/index.ts:92](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L92)

メトリクス

#### filesProcessed

> **filesProcessed**: `number`

#### issuesFound

> **issuesFound**: `number`

#### startTime

> **startTime**: `number`

***

### projectRoot

> **projectRoot**: `string`

Defined in: [plugins/index.ts:79](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L79)

プロジェクトルート
