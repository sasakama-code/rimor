[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaintAnalysisWithViolations

# Interface: TaintAnalysisWithViolations

Defined in: security/index.ts:156

セキュリティ違反を含むTaint分析結果

## Extended by

- [`TaintAnalysisResult`](TaintAnalysisResult.md)

## Properties

### taintPaths?

> `optional` **taintPaths**: `object`[]

Defined in: security/index.ts:160

違反パス

#### from

> **from**: `string`

#### through

> **through**: `string`[]

#### to

> **to**: `string`

***

### violations

> **violations**: [`SecurityViolation`](SecurityViolation.md)[]

Defined in: security/index.ts:158

セキュリティ違反のリスト
