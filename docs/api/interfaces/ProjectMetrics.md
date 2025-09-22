[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / ProjectMetrics

# Interface: ProjectMetrics

Defined in: [shared/index.ts:259](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L259)

プロジェクトメトリクス

## Properties

### blankLines

> **blankLines**: `number`

Defined in: [shared/index.ts:269](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L269)

空行数

***

### commentLines

> **commentLines**: `number`

Defined in: [shared/index.ts:267](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L267)

コメント行数

***

### complexity?

> `optional` **complexity**: `object`

Defined in: [shared/index.ts:280](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L280)

複雑度

#### cognitive

> **cognitive**: `number`

#### cyclomatic

> **cyclomatic**: `number`

#### halstead

> **halstead**: `Record`\<`string`, `number`\>

***

### languages

> **languages**: `Record`\<`string`, \{ `files`: `number`; `lines`: `number`; `percentage`: `number`; \}\>

Defined in: [shared/index.ts:271](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L271)

言語別統計

***

### linesOfCode

> **linesOfCode**: `number`

Defined in: [shared/index.ts:265](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L265)

コード行数

***

### totalFiles

> **totalFiles**: `number`

Defined in: [shared/index.ts:261](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L261)

総ファイル数

***

### totalLines

> **totalLines**: `number`

Defined in: [shared/index.ts:263](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L263)

総行数
