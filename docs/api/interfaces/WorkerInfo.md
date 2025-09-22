[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / WorkerInfo

# Interface: WorkerInfo

Defined in: [workers/index.ts:61](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L61)

ワーカー情報

## Properties

### cpuUsage?

> `optional` **cpuUsage**: `number`

Defined in: [workers/index.ts:75](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L75)

CPU使用率

***

### createdAt

> **createdAt**: `string`

Defined in: [workers/index.ts:79](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L79)

作成日時

***

### currentTask?

> `optional` **currentTask**: [`WorkerTask`](WorkerTask.md)

Defined in: [workers/index.ts:69](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L69)

現在のタスク

***

### errorCount

> **errorCount**: `number`

Defined in: [workers/index.ts:73](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L73)

エラー数

***

### id

> **id**: `string`

Defined in: [workers/index.ts:63](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L63)

ワーカーID

***

### lastActiveAt?

> `optional` **lastActiveAt**: `string`

Defined in: [workers/index.ts:81](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L81)

最終活動日時

***

### memoryUsage?

> `optional` **memoryUsage**: `number`

Defined in: [workers/index.ts:77](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L77)

メモリ使用量

***

### name?

> `optional` **name**: `string`

Defined in: [workers/index.ts:65](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L65)

ワーカー名

***

### processedTasks

> **processedTasks**: `number`

Defined in: [workers/index.ts:71](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L71)

処理済みタスク数

***

### status

> **status**: [`WorkerStatus`](../type-aliases/WorkerStatus.md)

Defined in: [workers/index.ts:67](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L67)

状態
