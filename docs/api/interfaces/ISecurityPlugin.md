[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / ISecurityPlugin

# Interface: ISecurityPlugin

Defined in: plugins/index.ts:165

セキュリティプラグイン

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

> **type**: `"SECURITY"`

Defined in: plugins/index.ts:166

プラグインタイプ

#### Overrides

[`IPlugin`](IPlugin.md).[`type`](IPlugin.md#type)

## Methods

### checkVulnerabilities()?

> `optional` **checkVulnerabilities**(`dependencies`): `Promise`\<[`Vulnerability`](Vulnerability.md)[]\>

Defined in: plugins/index.ts:170

脆弱性チェック

#### Parameters

##### dependencies

`Record`\<`string`, `string`\>

#### Returns

`Promise`\<[`Vulnerability`](Vulnerability.md)[]\>

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

***

### scan()

> **scan**(`target`): `Promise`\<[`SecurityIssue`](SecurityIssue.md)[]\>

Defined in: plugins/index.ts:168

セキュリティスキャン

#### Parameters

##### target

`string`

#### Returns

`Promise`\<[`SecurityIssue`](SecurityIssue.md)[]\>
