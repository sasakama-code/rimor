[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / IWorkerPool

# Interface: IWorkerPool

Defined in: workers/index.ts:175

ワーカープールインターフェース

## Methods

### cancelAllTasks()

> **cancelAllTasks**(): `Promise`\<`void`\>

Defined in: workers/index.ts:191

すべてのタスクのキャンセル

#### Returns

`Promise`\<`void`\>

***

### cancelTask()

> **cancelTask**(`taskId`): `Promise`\<`boolean`\>

Defined in: workers/index.ts:189

タスクのキャンセル

#### Parameters

##### taskId

`string`

#### Returns

`Promise`\<`boolean`\>

***

### execute()

> **execute**(`task`): `Promise`\<[`TaskResult`](TaskResult.md)\>

Defined in: workers/index.ts:177

タスクの実行

#### Parameters

##### task

[`WorkerTask`](WorkerTask.md)

#### Returns

`Promise`\<[`TaskResult`](TaskResult.md)\>

***

### executeBatch()

> **executeBatch**(`tasks`): `Promise`\<[`TaskResult`](TaskResult.md)[]\>

Defined in: workers/index.ts:179

バッチタスクの実行

#### Parameters

##### tasks

[`WorkerTask`](WorkerTask.md)[]

#### Returns

`Promise`\<[`TaskResult`](TaskResult.md)[]\>

***

### getStats()

> **getStats**(): [`WorkerPoolStats`](WorkerPoolStats.md)

Defined in: workers/index.ts:185

統計情報の取得

#### Returns

[`WorkerPoolStats`](WorkerPoolStats.md)

***

### getWorkers()

> **getWorkers**(): [`WorkerInfo`](WorkerInfo.md)[]

Defined in: workers/index.ts:187

ワーカー情報の取得

#### Returns

[`WorkerInfo`](WorkerInfo.md)[]

***

### start()

> **start**(): `Promise`\<`void`\>

Defined in: workers/index.ts:181

ワーカープールの開始

#### Returns

`Promise`\<`void`\>

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: workers/index.ts:183

ワーカープールの停止

#### Returns

`Promise`\<`void`\>
