[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / DomainEvent

# Interface: DomainEvent

Defined in: [domain/index.ts:136](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L136)

ドメインイベント

## Properties

### aggregateId

> **aggregateId**: `string`

Defined in: [domain/index.ts:142](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L142)

集約ID

***

### metadata?

> `optional` **metadata**: `object`

Defined in: [domain/index.ts:146](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L146)

メタデータ

#### Index Signature

\[`key`: `string`\]: `unknown`

#### causationId?

> `optional` **causationId**: `string`

#### correlationId?

> `optional` **correlationId**: `string`

#### userId?

> `optional` **userId**: `string`

***

### name

> **name**: `string`

Defined in: [domain/index.ts:138](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L138)

イベント名

***

### payload

> **payload**: `Record`\<`string`, `any`\>

Defined in: [domain/index.ts:144](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L144)

ペイロード

***

### timestamp

> **timestamp**: `string`

Defined in: [domain/index.ts:140](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/domain/index.ts#L140)

タイムスタンプ
