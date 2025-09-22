[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / WorkerPoolStats

# Interface: WorkerPoolStats

Defined in: [workers/index.ts:129](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L129)

ワーカープール統計

## Properties

### activeWorkers

> **activeWorkers**: `number`

Defined in: [workers/index.ts:131](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L131)

アクティブワーカー数

***

### avgExecutionTime

> **avgExecutionTime**: `number`

Defined in: [workers/index.ts:141](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L141)

平均実行時間（ミリ秒）

***

### cpuUsage

> **cpuUsage**: `number`

Defined in: [workers/index.ts:143](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L143)

CPU使用率

***

### failedTasks

> **failedTasks**: `number`

Defined in: [workers/index.ts:139](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L139)

失敗したタスク数

***

### idleWorkers

> **idleWorkers**: `number`

Defined in: [workers/index.ts:133](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L133)

アイドルワーカー数

***

### memoryUsage

> **memoryUsage**: `number`

Defined in: [workers/index.ts:145](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L145)

メモリ使用量（MB）

***

### pendingTasks

> **pendingTasks**: `number`

Defined in: [workers/index.ts:135](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L135)

待機中のタスク数

***

### processedTasks

> **processedTasks**: `number`

Defined in: [workers/index.ts:137](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L137)

処理済みタスク数

***

### uptime

> **uptime**: `number`

Defined in: [workers/index.ts:147](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L147)

稼働時間（秒）
