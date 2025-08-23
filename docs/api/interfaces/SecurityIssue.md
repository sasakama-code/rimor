[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / SecurityIssue

# Interface: SecurityIssue

Defined in: plugins/index.ts:195

セキュリティ問題

## Properties

### description

> **description**: `string`

Defined in: plugins/index.ts:203

説明

***

### location?

> `optional` **location**: `object`

Defined in: plugins/index.ts:205

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

Defined in: plugins/index.ts:213

参照

***

### remediation?

> `optional` **remediation**: `string`

Defined in: plugins/index.ts:211

修正方法

***

### severity

> **severity**: `"CRITICAL"` \| `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

Defined in: plugins/index.ts:199

深刻度

***

### title

> **title**: `string`

Defined in: plugins/index.ts:201

タイトル

***

### type

> **type**: `string`

Defined in: plugins/index.ts:197

タイプ
