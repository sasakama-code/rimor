[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / WorkerPoolConfig

# Interface: WorkerPoolConfig

Defined in: [workers/index.ts:109](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L109)

ワーカープール設定

## Properties

### autoScale?

> `optional` **autoScale**: `boolean`

Defined in: [workers/index.ts:121](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L121)

自動スケーリング有効化

***

### enableMetrics?

> `optional` **enableMetrics**: `boolean`

Defined in: [workers/index.ts:123](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L123)

メトリクス収集有効化

***

### maxQueueSize?

> `optional` **maxQueueSize**: `number`

Defined in: [workers/index.ts:115](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L115)

タスクキューの最大サイズ

***

### maxWorkers?

> `optional` **maxWorkers**: `number`

Defined in: [workers/index.ts:113](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L113)

最大ワーカー数

***

### minWorkers?

> `optional` **minWorkers**: `number`

Defined in: [workers/index.ts:111](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L111)

最小ワーカー数

***

### taskTimeout?

> `optional` **taskTimeout**: `number`

Defined in: [workers/index.ts:119](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L119)

タスクのデフォルトタイムアウト（ミリ秒）

***

### workerIdleTimeout?

> `optional` **workerIdleTimeout**: `number`

Defined in: [workers/index.ts:117](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L117)

ワーカーのアイドルタイムアウト（ミリ秒）
