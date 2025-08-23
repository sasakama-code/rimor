[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaskRegistry

# Interface: TaskRegistry

Defined in: workers/index.ts:202

タスクレジストリ

## Methods

### getHandler()

> **getHandler**(`type`): `undefined` \| [`TaskHandler`](../type-aliases/TaskHandler.md)\<`any`, `any`\>

Defined in: workers/index.ts:208

タスクハンドラーの取得

#### Parameters

##### type

`string`

#### Returns

`undefined` \| [`TaskHandler`](../type-aliases/TaskHandler.md)\<`any`, `any`\>

***

### getTypes()

> **getTypes**(): `string`[]

Defined in: workers/index.ts:210

すべてのタスクタイプの取得

#### Returns

`string`[]

***

### register()

> **register**\<`T`, `R`\>(`type`, `handler`): `void`

Defined in: workers/index.ts:204

タスクハンドラーの登録

#### Type Parameters

##### T

`T`

##### R

`R`

#### Parameters

##### type

`string`

##### handler

[`TaskHandler`](../type-aliases/TaskHandler.md)\<`T`, `R`\>

#### Returns

`void`

***

### unregister()

> **unregister**(`type`): `void`

Defined in: workers/index.ts:206

タスクハンドラーの登録解除

#### Parameters

##### type

`string`

#### Returns

`void`
