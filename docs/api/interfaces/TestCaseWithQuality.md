[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestCaseWithQuality

# Interface: TestCaseWithQuality

Defined in: [testing/index.ts:158](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L158)

品質メトリクスを持つテストケース

## Extended by

- [`TestCase`](TestCase.md)

## Properties

### qualityMetrics?

> `optional` **qualityMetrics**: `object`

Defined in: [testing/index.ts:160](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L160)

品質メトリクス

#### assertionDensity?

> `optional` **assertionDensity**: `number`

アサーション密度（アサーション数/コード行数）

#### complexity?

> `optional` **complexity**: `number`

複雑度

#### testCoverage?

> `optional` **testCoverage**: `number`

テストカバレッジ（パーセント）

#### testMaintainability?

> `optional` **testMaintainability**: `number`

保守性スコア（0-100）

#### testReliability?

> `optional` **testReliability**: `number`

信頼性スコア（0-100）
