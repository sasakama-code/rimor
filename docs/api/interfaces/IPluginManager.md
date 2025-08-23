[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / IPluginManager

# Interface: IPluginManager

Defined in: plugins/index.ts:257

プラグインマネージャーインターフェース

## Methods

### execute()

> **execute**(`pluginName`, `input`): `Promise`\<[`PluginResult`](PluginResult.md)\>

Defined in: plugins/index.ts:267

プラグイン実行

#### Parameters

##### pluginName

`string`

##### input

`any`

#### Returns

`Promise`\<[`PluginResult`](PluginResult.md)\>

***

### executeAll()

> **executeAll**(`input`): `Promise`\<[`PluginResult`](PluginResult.md)[]\>

Defined in: plugins/index.ts:269

すべてのプラグイン実行

#### Parameters

##### input

`any`

#### Returns

`Promise`\<[`PluginResult`](PluginResult.md)[]\>

***

### getAllPlugins()

> **getAllPlugins**(): [`IPlugin`](IPlugin.md)[]

Defined in: plugins/index.ts:265

すべてのプラグイン取得

#### Returns

[`IPlugin`](IPlugin.md)[]

***

### getPlugin()

> **getPlugin**(`name`): `undefined` \| [`IPlugin`](IPlugin.md)

Defined in: plugins/index.ts:263

プラグイン取得

#### Parameters

##### name

`string`

#### Returns

`undefined` \| [`IPlugin`](IPlugin.md)

***

### register()

> **register**(`plugin`): `void`

Defined in: plugins/index.ts:259

プラグイン登録

#### Parameters

##### plugin

[`IPlugin`](IPlugin.md)

#### Returns

`void`

***

### unregister()

> **unregister**(`pluginName`): `void`

Defined in: plugins/index.ts:261

プラグイン登録解除

#### Parameters

##### pluginName

`string`

#### Returns

`void`
