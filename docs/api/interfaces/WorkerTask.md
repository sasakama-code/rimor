[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / WorkerTask

# Interface: WorkerTask

Defined in: workers/index.ts:37

ワーカータスク
SRP: タスクの情報に特化

## Properties

### completedAt?

> `optional` **completedAt**: `string`

Defined in: workers/index.ts:55

完了日時

***

### createdAt

> **createdAt**: `string`

Defined in: workers/index.ts:51

作成日時

***

### id

> **id**: `string`

Defined in: workers/index.ts:39

タスクID

***

### payload

> **payload**: `any`

Defined in: workers/index.ts:45

ペイロード

***

### priority?

> `optional` **priority**: [`TaskPriority`](../type-aliases/TaskPriority.md)

Defined in: workers/index.ts:43

優先度

***

### retryCount?

> `optional` **retryCount**: `number`

Defined in: workers/index.ts:49

リトライ回数

***

### startedAt?

> `optional` **startedAt**: `string`

Defined in: workers/index.ts:53

開始日時

***

### timeout?

> `optional` **timeout**: `number`

Defined in: workers/index.ts:47

タイムアウト（ミリ秒）

***

### type

> **type**: `string`

Defined in: workers/index.ts:41

タスクタイプ
