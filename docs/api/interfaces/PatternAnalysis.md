[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / PatternAnalysis

# Interface: PatternAnalysis

Defined in: shared/index.ts:117

パターン分析結果

## Properties

### antiPatterns

> **antiPatterns**: [`AntiPattern`](AntiPattern.md)[]

Defined in: shared/index.ts:121

検出されたアンチパターン

***

### designPatterns

> **designPatterns**: [`DesignPattern`](DesignPattern.md)[]

Defined in: shared/index.ts:119

検出されたデザインパターン

***

### recommendations

> **recommendations**: [`PatternRecommendation`](PatternRecommendation.md)[]

Defined in: shared/index.ts:123

推奨事項

***

### summary

> **summary**: `object`

Defined in: shared/index.ts:125

サマリー

#### codeQualityScore

> **codeQualityScore**: `number`

#### maintainabilityIndex

> **maintainabilityIndex**: `number`

#### totalAntiPatterns

> **totalAntiPatterns**: `number`

#### totalDesignPatterns

> **totalDesignPatterns**: `number`
