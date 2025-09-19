[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaintAnalysisWithAnnotations

# Interface: TaintAnalysisWithAnnotations

Defined in: [security/index.ts:133](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L133)

アノテーション情報を含むTaint分析結果

## Extended by

- [`TaintAnalysisResult`](TaintAnalysisResult.md)

## Properties

### annotations?

> `optional` **annotations**: `object`

Defined in: [security/index.ts:135](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/security/index.ts#L135)

アノテーション情報

#### errors?

> `optional` **errors**: `object`[]

アノテーションエラー

#### polyTaintMethods

> **polyTaintMethods**: `string`[]

PolyTaintメソッド

#### suppressedMethods

> **suppressedMethods**: `string`[]

抑制されたメソッド

#### taintedProperties

> **taintedProperties**: `string`[]

汚染されたプロパティ

#### untaintedProperties

> **untaintedProperties**: `string`[]

安全なプロパティ
