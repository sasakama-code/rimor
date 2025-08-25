[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaintFlow

# Interface: TaintFlow

Defined in: security/index.ts:12

Taintフローの基本構造
KISS原則: 必要最小限のフィールドで表現

## Properties

### id

> **id**: `string`

Defined in: security/index.ts:14

フローの一意識別子

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `any`\>

Defined in: security/index.ts:24

追加情報（オプション）

***

### path

> **path**: `string`[]

Defined in: security/index.ts:20

フローの経路

***

### severity

> **severity**: [`TaintSeverity`](../type-aliases/TaintSeverity.md)

Defined in: security/index.ts:22

深刻度

***

### sink

> **sink**: `string`

Defined in: security/index.ts:18

汚染の到達先

***

### source

> **source**: `string`

Defined in: security/index.ts:16

汚染の発生源
