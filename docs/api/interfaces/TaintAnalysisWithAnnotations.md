[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TaintAnalysisWithAnnotations

# Interface: TaintAnalysisWithAnnotations

Defined in: security/index.ts:133

アノテーション情報を含むTaint分析結果

## Extended by

- [`TaintAnalysisResult`](TaintAnalysisResult.md)

## Properties

### annotations?

> `optional` **annotations**: `object`

Defined in: security/index.ts:135

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
