[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / IPlugin

# Interface: IPlugin

Defined in: [plugins/index.ts:103](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L103)

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

Defined in: [plugins/index.ts:109](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L109)

メタデータ

***

### name

> **name**: `string`

Defined in: [plugins/index.ts:105](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L105)

プラグイン名

***

### type

> **type**: [`PluginType`](../type-aliases/PluginType.md)

Defined in: [plugins/index.ts:107](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L107)

プラグインタイプ

## Methods

### cleanup()?

> `optional` **cleanup**(): `Promise`\<`void`\>

Defined in: [plugins/index.ts:115](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L115)

クリーンアップ

#### Returns

`Promise`\<`void`\>

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
