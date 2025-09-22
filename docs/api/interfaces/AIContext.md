[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AIContext

# Interface: AIContext

Defined in: [ai/index.ts:115](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L115)

AIコンテキスト情報

## Properties

### configuration

> **configuration**: `object`

Defined in: [ai/index.ts:127](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L127)

設定情報

#### Index Signature

\[`key`: `string`\]: `boolean`

#### hasESLint

> **hasESLint**: `boolean`

#### hasJest

> **hasJest**: `boolean`

#### hasPrettier

> **hasPrettier**: `boolean`

#### hasTypeScript

> **hasTypeScript**: `boolean`

***

### dependencies

> **dependencies**: `string`[] \| `Record`\<`string`, `string`\>

Defined in: [ai/index.ts:125](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L125)

依存関係

***

### framework

> **framework**: `string`

Defined in: [ai/index.ts:119](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L119)

フレームワーク

***

### languages

> **languages**: `string`[]

Defined in: [ai/index.ts:123](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L123)

使用言語

***

### projectType

> **projectType**: `string`

Defined in: [ai/index.ts:117](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L117)

プロジェクトタイプ

***

### testFramework

> **testFramework**: `string`

Defined in: [ai/index.ts:121](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L121)

テストフレームワーク
