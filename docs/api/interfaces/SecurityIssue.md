[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / SecurityIssue

# Interface: SecurityIssue

Defined in: [plugins/index.ts:195](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L195)

セキュリティ問題

## Properties

### description

> **description**: `string`

Defined in: [plugins/index.ts:203](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L203)

説明

***

### location?

> `optional` **location**: `object`

Defined in: [plugins/index.ts:205](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L205)

場所

#### column?

> `optional` **column**: `number`

#### file

> **file**: `string`

#### line?

> `optional` **line**: `number`

***

### references?

> `optional` **references**: `string`[]

Defined in: [plugins/index.ts:213](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L213)

参照

***

### remediation?

> `optional` **remediation**: `string`

Defined in: [plugins/index.ts:211](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L211)

修正方法

***

### severity

> **severity**: `"CRITICAL"` \| `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: [plugins/index.ts:199](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L199)

深刻度

***

### title

> **title**: `string`

Defined in: [plugins/index.ts:201](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L201)

タイトル

***

### type

> **type**: `string`

Defined in: [plugins/index.ts:197](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L197)

タイプ
