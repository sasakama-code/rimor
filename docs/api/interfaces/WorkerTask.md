[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / WorkerTask

# Interface: WorkerTask

Defined in: [workers/index.ts:37](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L37)

ワーカータスク
SRP: タスクの情報に特化

## Properties

### completedAt?

> `optional` **completedAt**: `string`

Defined in: [workers/index.ts:55](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L55)

完了日時

***

### createdAt

> **createdAt**: `string`

Defined in: [workers/index.ts:51](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L51)

作成日時

***

### id

> **id**: `string`

Defined in: [workers/index.ts:39](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L39)

タスクID

***

### payload

> **payload**: `unknown`

Defined in: [workers/index.ts:45](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L45)

ペイロード

***

### priority?

> `optional` **priority**: [`TaskPriority`](../type-aliases/TaskPriority.md)

Defined in: [workers/index.ts:43](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L43)

優先度

***

### retryCount?

> `optional` **retryCount**: `number`

Defined in: [workers/index.ts:49](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L49)

リトライ回数

***

### startedAt?

> `optional` **startedAt**: `string`

Defined in: [workers/index.ts:53](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L53)

開始日時

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [workers/index.ts:47](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L47)

タイムアウト（ミリ秒）

***

### type

> **type**: `string`

Defined in: [workers/index.ts:41](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L41)

タスクタイプ
