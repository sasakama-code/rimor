[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / ValidationResult

# Interface: ValidationResult

Defined in: [plugins/index.ts:176](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L176)

検証結果

## Properties

### errors?

> `optional` **errors**: `object`[]

Defined in: [plugins/index.ts:180](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L180)

エラー

#### code?

> `optional` **code**: `string`

#### message

> **message**: `string`

#### path

> **path**: `string`

***

### valid

> **valid**: `boolean`

Defined in: [plugins/index.ts:178](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L178)

有効かどうか

***

### warnings?

> `optional` **warnings**: `object`[]

Defined in: [plugins/index.ts:186](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L186)

警告

#### message

> **message**: `string`

#### path

> **path**: `string`
