[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / TestCaseWithQuality

# Interface: TestCaseWithQuality

Defined in: testing/index.ts:148

品質メトリクスを持つテストケース

## Extended by

- [`TestCase`](TestCase.md)

## Properties

### qualityMetrics?

> `optional` **qualityMetrics**: `object`

Defined in: testing/index.ts:150

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
