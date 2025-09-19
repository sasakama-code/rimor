[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / IWorkerPool

# Interface: IWorkerPool

Defined in: [workers/index.ts:175](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L175)

ワーカープールインターフェース

## Methods

### cancelAllTasks()

> **cancelAllTasks**(): `Promise`\<`void`\>

Defined in: [workers/index.ts:191](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L191)

すべてのタスクのキャンセル

#### Returns

`Promise`\<`void`\>

***

### cancelTask()

> **cancelTask**(`taskId`): `Promise`\<`boolean`\>

Defined in: [workers/index.ts:189](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L189)

タスクのキャンセル

#### Parameters

##### taskId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### execute()

> **execute**(`task`): `Promise`\<[`TaskResult`](TaskResult.md)\>

Defined in: [workers/index.ts:177](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L177)

タスクの実行

#### Parameters

##### task

[`WorkerTask`](WorkerTask.md)

#### Returns

`Promise`\<[`TaskResult`](TaskResult.md)\>

***

### executeBatch()

> **executeBatch**(`tasks`): `Promise`\<[`TaskResult`](TaskResult.md)[]\>

Defined in: [workers/index.ts:179](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L179)

バッチタスクの実行

#### Parameters

##### tasks

[`WorkerTask`](WorkerTask.md)[]

#### Returns

`Promise`\<[`TaskResult`](TaskResult.md)[]\>

***

### getStats()

> **getStats**(): [`WorkerPoolStats`](WorkerPoolStats.md)

Defined in: [workers/index.ts:185](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L185)

統計情報の取得

#### Returns

[`WorkerPoolStats`](WorkerPoolStats.md)

***

### getWorkers()

> **getWorkers**(): [`WorkerInfo`](WorkerInfo.md)[]

Defined in: [workers/index.ts:187](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L187)

ワーカー情報の取得

#### Returns

[`WorkerInfo`](WorkerInfo.md)[]

***

### start()

> **start**(): `Promise`\<`void`\>

Defined in: [workers/index.ts:181](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L181)

ワーカープールの開始

#### Returns

`Promise`\<`void`\>

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: [workers/index.ts:183](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L183)

ワーカープールの停止

#### Returns

`Promise`\<`void`\>
