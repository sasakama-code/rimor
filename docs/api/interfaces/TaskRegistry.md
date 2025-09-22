[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaskRegistry

# Interface: TaskRegistry

Defined in: [workers/index.ts:202](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L202)

タスクレジストリ

## Methods

### getHandler()

> **getHandler**(`type`): `undefined` \| [`TaskHandler`](../type-aliases/TaskHandler.md)\<`any`, `any`\>

Defined in: [workers/index.ts:208](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L208)

タスクハンドラーの取得

#### Parameters

##### type

`string`

#### Returns

`undefined` \| [`TaskHandler`](../type-aliases/TaskHandler.md)\<`any`, `any`\>

***

### getTypes()

> **getTypes**(): `string`[]

Defined in: [workers/index.ts:210](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L210)

すべてのタスクタイプの取得

#### Returns

`string`[]

***

### register()

> **register**\<`T`, `R`\>(`type`, `handler`): `void`

Defined in: [workers/index.ts:204](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L204)

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

Defined in: [workers/index.ts:206](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L206)

タスクハンドラーの登録解除

#### Parameters

##### type

`string`

#### Returns

`void`
