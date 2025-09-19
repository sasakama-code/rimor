[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / PackageDependency

# Interface: PackageDependency

Defined in: [shared/index.ts:154](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L154)

パッケージ依存関係

## Properties

### name

> **name**: `string`

Defined in: [shared/index.ts:156](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L156)

パッケージ名

***

### resolvedVersion?

> `optional` **resolvedVersion**: `string`

Defined in: [shared/index.ts:162](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L162)

解決済みバージョン

***

### type

> **type**: `"dependencies"` \| `"devDependencies"` \| `"peerDependencies"` \| `"optionalDependencies"`

Defined in: [shared/index.ts:160](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L160)

依存タイプ

***

### version

> **version**: `string`

Defined in: [shared/index.ts:158](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L158)

バージョン

***

### vulnerabilities?

> `optional` **vulnerabilities**: `object`[]

Defined in: [shared/index.ts:164](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L164)

脆弱性

#### cve?

> `optional` **cve**: `string`

#### description

> **description**: `string`

#### severity

> **severity**: `"CRITICAL"` \| `"HIGH"` \| `"MEDIUM"` \| `"LOW"`
