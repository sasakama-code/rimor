[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / IValidatorPlugin

# Interface: IValidatorPlugin

Defined in: [plugins/index.ts:154](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L154)

バリデータープラグイン

## Extends

- [`IPlugin`](IPlugin.md)

## Properties

### metadata?

> `optional` **metadata**: [`PluginMetadata`](PluginMetadata.md)

Defined in: [plugins/index.ts:109](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L109)

メタデータ

#### Inherited from

[`IPlugin`](IPlugin.md).[`metadata`](IPlugin.md#metadata)

***

### name

> **name**: `string`

Defined in: [plugins/index.ts:105](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L105)

プラグイン名

#### Inherited from

[`IPlugin`](IPlugin.md).[`name`](IPlugin.md#name)

***

### supportedSchemas?

> `optional` **supportedSchemas**: `string`[]

Defined in: [plugins/index.ts:159](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L159)

サポートされるスキーマ

***

### type

> **type**: `"VALIDATOR"`

Defined in: [plugins/index.ts:155](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L155)

プラグインタイプ

#### Overrides

[`IPlugin`](IPlugin.md).[`type`](IPlugin.md#type)

## Methods

### cleanup()?

> `optional` **cleanup**(): `Promise`\<`void`\>

Defined in: [plugins/index.ts:115](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L115)

クリーンアップ

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`IPlugin`](IPlugin.md).[`cleanup`](IPlugin.md#cleanup)

***

### execute()

> **execute**(`input`, `context?`): `Promise`\<`unknown`\>

Defined in: [plugins/index.ts:113](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L113)

実行

#### Parameters

##### input

`unknown`

##### context?

[`PluginContext`](PluginContext.md)

#### Returns

`Promise`\<`unknown`\>

#### Inherited from

[`IPlugin`](IPlugin.md).[`execute`](IPlugin.md#execute)

***

### initialize()?

> `optional` **initialize**(`context`): `Promise`\<`void`\>

Defined in: [plugins/index.ts:111](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L111)

初期化

#### Parameters

##### context

[`PluginContext`](PluginContext.md)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`IPlugin`](IPlugin.md).[`initialize`](IPlugin.md#initialize)

***

### validate()

> **validate**(`data`, `schema?`): `Promise`\<[`ValidationResult`](ValidationResult.md)\>

Defined in: [plugins/index.ts:157](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L157)

検証

#### Parameters

##### data

`unknown`

##### schema?

`unknown`

#### Returns

`Promise`\<[`ValidationResult`](ValidationResult.md)\>
