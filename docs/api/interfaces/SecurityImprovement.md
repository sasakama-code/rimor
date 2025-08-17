[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / SecurityImprovement

# Interface: SecurityImprovement

Defined in: security/index.ts:90

セキュリティ改善提案

## Properties

### category

> **category**: [`ImprovementCategory`](../type-aliases/ImprovementCategory.md)

Defined in: security/index.ts:92

改善カテゴリ

***

### description

> **description**: `string`

Defined in: security/index.ts:96

改善内容の説明

***

### estimatedEffort

> **estimatedEffort**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: security/index.ts:98

実装工数の見積もり

***

### example?

> `optional` **example**: `string`

Defined in: security/index.ts:102

実装例（オプション）

***

### impact

> **impact**: [`TaintSeverity`](../type-aliases/TaintSeverity.md)

Defined in: security/index.ts:100

セキュリティへの影響度

***

### priority

> **priority**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: security/index.ts:94

優先度
