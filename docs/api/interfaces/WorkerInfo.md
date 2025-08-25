[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / WorkerInfo

# Interface: WorkerInfo

Defined in: workers/index.ts:61

ワーカー情報

## Properties

### cpuUsage?

> `optional` **cpuUsage**: `number`

Defined in: workers/index.ts:75

CPU使用率

***

### createdAt

> **createdAt**: `string`

Defined in: workers/index.ts:79

作成日時

***

### currentTask?

> `optional` **currentTask**: [`WorkerTask`](WorkerTask.md)

Defined in: workers/index.ts:69

現在のタスク

***

### errorCount

> **errorCount**: `number`

Defined in: workers/index.ts:73

エラー数

***

### id

> **id**: `string`

Defined in: workers/index.ts:63

ワーカーID

***

### lastActiveAt?

> `optional` **lastActiveAt**: `string`

Defined in: workers/index.ts:81

最終活動日時

***

### memoryUsage?

> `optional` **memoryUsage**: `number`

Defined in: workers/index.ts:77

メモリ使用量

***

### name?

> `optional` **name**: `string`

Defined in: workers/index.ts:65

ワーカー名

***

### processedTasks

> **processedTasks**: `number`

Defined in: workers/index.ts:71

処理済みタスク数

***

### status

> **status**: [`WorkerStatus`](../type-aliases/WorkerStatus.md)

Defined in: workers/index.ts:67

状態
