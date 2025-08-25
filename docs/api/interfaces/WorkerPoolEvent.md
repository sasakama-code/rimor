[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / WorkerPoolEvent

# Interface: WorkerPoolEvent

Defined in: workers/index.ts:153

ワーカープールイベント

## Properties

### details?

> `optional` **details**: `any`

Defined in: workers/index.ts:169

詳細

***

### taskId?

> `optional` **taskId**: `string`

Defined in: workers/index.ts:167

タスクID

***

### timestamp

> **timestamp**: `string`

Defined in: workers/index.ts:163

タイムスタンプ

***

### type

> **type**: `"WORKER_CREATED"` \| `"WORKER_TERMINATED"` \| `"TASK_STARTED"` \| `"TASK_COMPLETED"` \| `"TASK_FAILED"` \| `"POOL_SCALED"`

Defined in: workers/index.ts:155

イベントタイプ

***

### workerId?

> `optional` **workerId**: `string`

Defined in: workers/index.ts:165

ワーカーID
