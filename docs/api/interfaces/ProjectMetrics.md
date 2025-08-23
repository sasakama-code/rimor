[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / ProjectMetrics

# Interface: ProjectMetrics

Defined in: shared/index.ts:259

プロジェクトメトリクス

## Properties

### blankLines

> **blankLines**: `number`

Defined in: shared/index.ts:269

空行数

***

### commentLines

> **commentLines**: `number`

Defined in: shared/index.ts:267

コメント行数

***

### complexity?

> `optional` **complexity**: `object`

Defined in: shared/index.ts:277

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

Defined in: shared/index.ts:271

言語別統計

***

### linesOfCode

> **linesOfCode**: `number`

Defined in: shared/index.ts:265

コード行数

***

### totalFiles

> **totalFiles**: `number`

Defined in: shared/index.ts:261

総ファイル数

***

### totalLines

> **totalLines**: `number`

Defined in: shared/index.ts:263

総行数
