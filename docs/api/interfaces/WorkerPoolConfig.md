[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / WorkerPoolConfig

# Interface: WorkerPoolConfig

Defined in: workers/index.ts:109

ワーカープール設定

## Properties

### autoScale?

> `optional` **autoScale**: `boolean`

Defined in: workers/index.ts:121

自動スケーリング有効化

***

### enableMetrics?

> `optional` **enableMetrics**: `boolean`

Defined in: workers/index.ts:123

メトリクス収集有効化

***

### maxQueueSize?

> `optional` **maxQueueSize**: `number`

Defined in: workers/index.ts:115

タスクキューの最大サイズ

***

### maxWorkers?

> `optional` **maxWorkers**: `number`

Defined in: workers/index.ts:113

最大ワーカー数

***

### minWorkers?

> `optional` **minWorkers**: `number`

Defined in: workers/index.ts:111

最小ワーカー数

***

### taskTimeout?

> `optional` **taskTimeout**: `number`

Defined in: workers/index.ts:119

タスクのデフォルトタイムアウト（ミリ秒）

***

### workerIdleTimeout?

> `optional` **workerIdleTimeout**: `number`

Defined in: workers/index.ts:117

ワーカーのアイドルタイムアウト（ミリ秒）
