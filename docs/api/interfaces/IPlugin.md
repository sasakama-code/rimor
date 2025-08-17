[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / IPlugin

# Interface: IPlugin

Defined in: plugins/index.ts:103

基本プラグインインターフェース
SRP: プラグインの基本契約のみを定義

## Extended by

- [`IAnalyzerPlugin`](IAnalyzerPlugin.md)
- [`IFormatterPlugin`](IFormatterPlugin.md)
- [`IReporterPlugin`](IReporterPlugin.md)
- [`IValidatorPlugin`](IValidatorPlugin.md)
- [`ISecurityPlugin`](ISecurityPlugin.md)

## Properties

### metadata?

> `optional` **metadata**: [`PluginMetadata`](PluginMetadata.md)

Defined in: plugins/index.ts:109

メタデータ

***

### name

> **name**: `string`

Defined in: plugins/index.ts:105

プラグイン名

***

### type

> **type**: [`PluginType`](../type-aliases/PluginType.md)

Defined in: plugins/index.ts:107

プラグインタイプ

## Methods

### cleanup()?

> `optional` **cleanup**(): `Promise`\<`void`\>

Defined in: plugins/index.ts:115

クリーンアップ

#### Returns

`Promise`\<`void`\>

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
