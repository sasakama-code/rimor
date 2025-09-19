[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AIFormattedIssue

# Interface: AIFormattedIssue

Defined in: [ai/index.ts:79](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L79)

AIフォーマット済みの問題

## Properties

### category

> **category**: `string`

Defined in: [ai/index.ts:81](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L81)

カテゴリ

***

### codeSnippet?

> `optional` **codeSnippet**: `string`

Defined in: [ai/index.ts:95](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L95)

コードスニペット

***

### column?

> `optional` **column**: `number`

Defined in: [ai/index.ts:89](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L89)

列番号

***

### impact

> **impact**: `"low"` \| `"medium"` \| `"high"`

Defined in: [ai/index.ts:93](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L93)

影響度

***

### line?

> `optional` **line**: `number`

Defined in: [ai/index.ts:87](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L87)

行番号

***

### message

> **message**: `string`

Defined in: [ai/index.ts:85](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L85)

メッセージ

***

### severity

> **severity**: `string`

Defined in: [ai/index.ts:83](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L83)

深刻度

***

### suggestion?

> `optional` **suggestion**: `string`

Defined in: [ai/index.ts:91](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L91)

修正提案
