[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / ImportInfo

# Interface: ImportInfo

Defined in: [shared/index.ts:174](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L174)

インポート情報

## Properties

### alias?

> `optional` **alias**: `string`

Defined in: [shared/index.ts:180](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L180)

エイリアス

***

### imported

> **imported**: `string`[]

Defined in: [shared/index.ts:178](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L178)

インポートされた名前

***

### location

> **location**: `object`

Defined in: [shared/index.ts:184](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L184)

場所

#### file

> **file**: `string`

#### line

> **line**: `number`

***

### source

> **source**: `string`

Defined in: [shared/index.ts:176](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L176)

インポート元

***

### type

> **type**: `"default"` \| `"namespace"` \| `"named"` \| `"side-effect"`

Defined in: [shared/index.ts:182](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L182)

インポートタイプ
