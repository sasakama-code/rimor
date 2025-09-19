[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / SuggestedFix

# Interface: SuggestedFix

Defined in: [ai/index.ts:173](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L173)

修正提案

## Properties

### codeChanges

> **codeChanges**: `object`[]

Defined in: [ai/index.ts:177](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L177)

コード変更

#### after

> **after**: `string`

#### before

> **before**: `string`

#### file

> **file**: `string`

#### location

> **location**: [`LocationInfo`](LocationInfo.md)

***

### description

> **description**: `string`

Defined in: [ai/index.ts:175](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L175)

説明

***

### impact

> **impact**: [`ImpactEstimation`](ImpactEstimation.md)

Defined in: [ai/index.ts:184](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/ai/index.ts#L184)

影響度評価
