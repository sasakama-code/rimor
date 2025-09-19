[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / PatternAnalysis

# Interface: PatternAnalysis

Defined in: [shared/index.ts:117](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L117)

パターン分析結果

## Properties

### antiPatterns

> **antiPatterns**: [`AntiPattern`](AntiPattern.md)[]

Defined in: [shared/index.ts:121](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L121)

検出されたアンチパターン

***

### designPatterns

> **designPatterns**: [`DesignPattern`](DesignPattern.md)[]

Defined in: [shared/index.ts:119](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L119)

検出されたデザインパターン

***

### recommendations

> **recommendations**: [`PatternRecommendation`](PatternRecommendation.md)[]

Defined in: [shared/index.ts:123](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L123)

推奨事項

***

### summary

> **summary**: `object`

Defined in: [shared/index.ts:125](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/shared/index.ts#L125)

サマリー

#### codeQualityScore

> **codeQualityScore**: `number`

#### maintainabilityIndex

> **maintainabilityIndex**: `number`

#### totalAntiPatterns

> **totalAntiPatterns**: `number`

#### totalDesignPatterns

> **totalDesignPatterns**: `number`
