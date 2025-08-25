[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / SecurityViolation

# Interface: SecurityViolation

Defined in: security/index.ts:53

セキュリティ違反の定義
ISP（インターフェース分離原則）: 必要な情報のみを含む

## Properties

### description

> **description**: `string`

Defined in: security/index.ts:63

違反の説明

***

### fix?

> `optional` **fix**: `string`

Defined in: security/index.ts:71

修正提案（オプション）

***

### location?

> `optional` **location**: `object`

Defined in: security/index.ts:65

発生場所（オプション）

#### column?

> `optional` **column**: `number`

#### file

> **file**: `string`

#### line

> **line**: `number`

***

### severity

> **severity**: [`TaintSeverity`](../type-aliases/TaintSeverity.md)

Defined in: security/index.ts:57

深刻度

***

### sink

> **sink**: `string`

Defined in: security/index.ts:61

影響先

***

### source

> **source**: `string`

Defined in: security/index.ts:59

発生源

***

### type

> **type**: [`ViolationType`](../type-aliases/ViolationType.md)

Defined in: security/index.ts:55

違反の種類
