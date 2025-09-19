[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaintFlow

# Interface: TaintFlow

Defined in: [security/index.ts:12](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L12)

Taintフローの基本構造
KISS原則: 必要最小限のフィールドで表現

## Properties

### id

> **id**: `string`

Defined in: [security/index.ts:14](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L14)

フローの一意識別子

***

### metadata?

> `optional` **metadata**: `Record`\<`string`, `unknown`\>

Defined in: [security/index.ts:24](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L24)

追加情報（オプション）

***

### path

> **path**: `string`[]

Defined in: [security/index.ts:20](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L20)

フローの経路

***

### severity

> **severity**: [`TaintSeverity`](../type-aliases/TaintSeverity.md)

Defined in: [security/index.ts:22](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L22)

深刻度

***

### sink

> **sink**: `string`

Defined in: [security/index.ts:18](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L18)

汚染の到達先

***

### source

> **source**: `string`

Defined in: [security/index.ts:16](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L16)

汚染の発生源
