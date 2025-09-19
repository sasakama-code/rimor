[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / IReporterPlugin

# Interface: IReporterPlugin

Defined in: [plugins/index.ts:143](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L143)

レポータープラグイン

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

### supportedOutputs

> **supportedOutputs**: `string`[]

Defined in: [plugins/index.ts:148](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L148)

サポートされる出力形式

***

### type

> **type**: `"REPORTER"`

Defined in: [plugins/index.ts:144](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L144)

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

### generateReport()

> **generateReport**(`data`, `outputPath?`): `Promise`\<`void`\>

Defined in: [plugins/index.ts:146](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L146)

レポート生成

#### Parameters

##### data

`unknown`

##### outputPath?

`string`

#### Returns

`Promise`\<`void`\>

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
