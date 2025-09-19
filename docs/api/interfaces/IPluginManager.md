[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / IPluginManager

# Interface: IPluginManager

Defined in: [plugins/index.ts:257](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L257)

プラグインマネージャーインターフェース

## Methods

### execute()

> **execute**(`pluginName`, `input`): `Promise`\<[`PluginResult`](PluginResult.md)\>

Defined in: [plugins/index.ts:267](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L267)

プラグイン実行

#### Parameters

##### pluginName

`string`

##### input

`unknown`

#### Returns

`Promise`\<[`PluginResult`](PluginResult.md)\>

***

### executeAll()

> **executeAll**(`input`): `Promise`\<[`PluginResult`](PluginResult.md)[]\>

Defined in: [plugins/index.ts:269](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L269)

すべてのプラグイン実行

#### Parameters

##### input

`unknown`

#### Returns

`Promise`\<[`PluginResult`](PluginResult.md)[]\>

***

### getAllPlugins()

> **getAllPlugins**(): [`IPlugin`](IPlugin.md)[]

Defined in: [plugins/index.ts:265](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L265)

すべてのプラグイン取得

#### Returns

[`IPlugin`](IPlugin.md)[]

***

### getPlugin()

> **getPlugin**(`name`): `undefined` \| [`IPlugin`](IPlugin.md)

Defined in: [plugins/index.ts:263](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L263)

プラグイン取得

#### Parameters

##### name

`string`

#### Returns

`undefined` \| [`IPlugin`](IPlugin.md)

***

### register()

> **register**(`plugin`): `void`

Defined in: [plugins/index.ts:259](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L259)

プラグイン登録

#### Parameters

##### plugin

[`IPlugin`](IPlugin.md)

#### Returns

`void`

***

### unregister()

> **unregister**(`pluginName`): `void`

Defined in: [plugins/index.ts:261](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L261)

プラグイン登録解除

#### Parameters

##### pluginName

`string`

#### Returns

`void`
