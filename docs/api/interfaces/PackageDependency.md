[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / PackageDependency

# Interface: PackageDependency

Defined in: shared/index.ts:154

パッケージ依存関係

## Properties

### name

> **name**: `string`

Defined in: shared/index.ts:156

パッケージ名

***

### resolvedVersion?

> `optional` **resolvedVersion**: `string`

Defined in: shared/index.ts:162

解決済みバージョン

***

### type

> **type**: `"dependencies"` \| `"devDependencies"` \| `"peerDependencies"` \| `"optionalDependencies"`

Defined in: shared/index.ts:160

依存タイプ

***

### version

> **version**: `string`

Defined in: shared/index.ts:158

バージョン

***

### vulnerabilities?

> `optional` **vulnerabilities**: `object`[]

Defined in: shared/index.ts:164

脆弱性

#### cve?

> `optional` **cve**: `string`

#### description

> **description**: `string`

#### severity

> **severity**: `"CRITICAL"` \| `"HIGH"` \| `"MEDIUM"` \| `"LOW"`
