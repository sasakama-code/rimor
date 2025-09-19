[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaskResult

# Interface: TaskResult

Defined in: [workers/index.ts:87](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L87)

タスク結果

## Properties

### data?

> `optional` **data**: `unknown`

Defined in: [workers/index.ts:93](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L93)

結果データ

***

### error?

> `optional` **error**: `object`

Defined in: [workers/index.ts:95](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L95)

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

Defined in: [workers/index.ts:101](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L101)

実行時間（ミリ秒）

***

### success

> **success**: `boolean`

Defined in: [workers/index.ts:91](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L91)

成功/失敗

***

### taskId

> **taskId**: `string`

Defined in: [workers/index.ts:89](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L89)

タスクID

***

### workerId?

> `optional` **workerId**: `string`

Defined in: [workers/index.ts:103](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/workers/index.ts#L103)

ワーカーID
