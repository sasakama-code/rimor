[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / WorkerPoolEvent

# Interface: WorkerPoolEvent

Defined in: [workers/index.ts:153](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L153)

ワーカープールイベント

## Properties

### details?

> `optional` **details**: `unknown`

Defined in: [workers/index.ts:169](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L169)

詳細

***

### taskId?

> `optional` **taskId**: `string`

Defined in: [workers/index.ts:167](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L167)

タスクID

***

### timestamp

> **timestamp**: `string`

Defined in: [workers/index.ts:163](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L163)

タイムスタンプ

***

### type

> **type**: `"WORKER_CREATED"` \| `"WORKER_TERMINATED"` \| `"TASK_STARTED"` \| `"TASK_COMPLETED"` \| `"TASK_FAILED"` \| `"POOL_SCALED"`

Defined in: [workers/index.ts:155](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L155)

イベントタイプ

***

### workerId?

> `optional` **workerId**: `string`

Defined in: [workers/index.ts:165](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L165)

ワーカーID
