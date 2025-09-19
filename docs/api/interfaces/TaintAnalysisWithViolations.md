[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaintAnalysisWithViolations

# Interface: TaintAnalysisWithViolations

Defined in: [security/index.ts:156](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L156)

セキュリティ違反を含むTaint分析結果

## Extended by

- [`TaintAnalysisResult`](TaintAnalysisResult.md)

## Properties

### taintPaths?

> `optional` **taintPaths**: `object`[]

Defined in: [security/index.ts:160](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L160)

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

Defined in: [security/index.ts:158](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L158)

セキュリティ違反のリスト
