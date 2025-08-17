[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / IAnalyzerPlugin

# Interface: IAnalyzerPlugin

Defined in: plugins/index.ts:121

分析プラグイン

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

### type

> **type**: `"ANALYZER"`

Defined in: plugins/index.ts:122

プラグインタイプ

#### Overrides

[`IPlugin`](IPlugin.md).[`type`](IPlugin.md#type)

## Methods

### analyzeFile()

> **analyzeFile**(`filePath`, `content`): `Promise`\<`Issue`[]\>

Defined in: plugins/index.ts:124

ファイル分析

#### Parameters

##### filePath

`string`

##### content

`string`

#### Returns

`Promise`\<`Issue`[]\>

***

### analyzeProject()?

> `optional` **analyzeProject**(`projectPath`): `Promise`\<`Issue`[]\>

Defined in: plugins/index.ts:126

プロジェクト分析

#### Parameters

##### projectPath

`string`

#### Returns

`Promise`\<`Issue`[]\>

***

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
