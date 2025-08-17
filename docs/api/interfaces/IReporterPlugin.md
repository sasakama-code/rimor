[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / IReporterPlugin

# Interface: IReporterPlugin

Defined in: plugins/index.ts:143

レポータープラグイン

## Extends

- [`IPlugin`](IPlugin.md)

## Properties

### metadata?

> `optional` **metadata**: [`PluginMetadata`](PluginMetadata.md)

Defined in: plugins/index.ts:109

メタデータ

#### Inherited from

[`IPlugin`](IPlugin.md).[`metadata`](IPlugin.md#metadata)

***

### name

> **name**: `string`

Defined in: plugins/index.ts:105

プラグイン名

#### Inherited from

[`IPlugin`](IPlugin.md).[`name`](IPlugin.md#name)

***

### supportedOutputs

> **supportedOutputs**: `string`[]

Defined in: plugins/index.ts:148

サポートされる出力形式

***

### type

> **type**: `"REPORTER"`

Defined in: plugins/index.ts:144

プラグインタイプ

#### Overrides

[`IPlugin`](IPlugin.md).[`type`](IPlugin.md#type)

## Methods

### cleanup()?

> `optional` **cleanup**(): `Promise`\<`void`\>

Defined in: plugins/index.ts:115

クリーンアップ

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`IPlugin`](IPlugin.md).[`cleanup`](IPlugin.md#cleanup)

***

### execute()

> **execute**(`input`, `context?`): `Promise`\<`any`\>

Defined in: plugins/index.ts:113

実行

#### Parameters

##### input

`any`

##### context?

[`PluginContext`](PluginContext.md)

#### Returns

`Promise`\<`any`\>

#### Inherited from

[`IPlugin`](IPlugin.md).[`execute`](IPlugin.md#execute)

***

### generateReport()

> **generateReport**(`data`, `outputPath?`): `Promise`\<`void`\>

Defined in: plugins/index.ts:146

レポート生成

#### Parameters

##### data

`any`

##### outputPath?

`string`

#### Returns

`Promise`\<`void`\>

***

### initialize()?

> `optional` **initialize**(`context`): `Promise`\<`void`\>

Defined in: plugins/index.ts:111

初期化

#### Parameters

##### context

[`PluginContext`](PluginContext.md)

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`IPlugin`](IPlugin.md).[`initialize`](IPlugin.md#initialize)
