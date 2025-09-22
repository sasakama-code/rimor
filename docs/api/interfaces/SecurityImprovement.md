[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / SecurityImprovement

# Interface: SecurityImprovement

Defined in: [security/index.ts:90](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L90)

セキュリティ改善提案

## Properties

### category

> **category**: [`ImprovementCategory`](../type-aliases/ImprovementCategory.md)

Defined in: [security/index.ts:92](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L92)

改善カテゴリ

***

### description

> **description**: `string`

Defined in: [security/index.ts:96](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L96)

改善内容の説明

***

### estimatedEffort

> **estimatedEffort**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: [security/index.ts:98](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L98)

実装工数の見積もり

***

### example?

> `optional` **example**: `string`

Defined in: [security/index.ts:102](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L102)

実装例（オプション）

***

### impact

> **impact**: [`TaintSeverity`](../type-aliases/TaintSeverity.md)

Defined in: [security/index.ts:100](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L100)

セキュリティへの影響度

***

### priority

> **priority**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: [security/index.ts:94](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L94)

優先度
