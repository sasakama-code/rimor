[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / VersionConstraint

# Interface: VersionConstraint

Defined in: [shared/index.ts:223](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L223)

バージョン制約

## Properties

### conflicts?

> `optional` **conflicts**: `string`[]

Defined in: [shared/index.ts:231](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L231)

満たさないバージョン

***

### satisfies?

> `optional` **satisfies**: `string`[]

Defined in: [shared/index.ts:229](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L229)

満たすバージョン

***

### type

> **type**: `"exact"` \| `"range"` \| `"caret"` \| `"tilde"` \| `"greater"` \| `"less"`

Defined in: [shared/index.ts:225](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L225)

制約タイプ

***

### value

> **value**: `string`

Defined in: [shared/index.ts:227](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L227)

値
