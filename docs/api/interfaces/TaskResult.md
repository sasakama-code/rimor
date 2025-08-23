[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaskResult

# Interface: TaskResult

Defined in: workers/index.ts:87

タスク結果

## Properties

### data?

> `optional` **data**: `any`

Defined in: workers/index.ts:93

結果データ

***

### error?

> `optional` **error**: `object`

Defined in: workers/index.ts:95

エラー

#### code?

> `optional` **code**: `string`

#### message

> **message**: `string`

#### stack?

> `optional` **stack**: `string`

***

### executionTime

> **executionTime**: `number`

Defined in: workers/index.ts:101

実行時間（ミリ秒）

***

### success

> **success**: `boolean`

Defined in: workers/index.ts:91

成功/失敗

***

### taskId

> **taskId**: `string`

Defined in: workers/index.ts:89

タスクID

***

### workerId?

> `optional` **workerId**: `string`

Defined in: workers/index.ts:103

ワーカーID
