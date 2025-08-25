[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AnalysisResultWithPlugins

# Interface: AnalysisResultWithPlugins

Defined in: analysis/index.ts:49

プラグイン情報を持つ分析結果
プラグインシステムとの統合をサポート

## Extended by

- [`AnalysisResult`](AnalysisResult.md)

## Properties

### pluginResults?

> `optional` **pluginResults**: `Record`\<`string`, `any`\>

Defined in: analysis/index.ts:53

プラグイン固有の結果

***

### pluginsExecuted?

> `optional` **pluginsExecuted**: `string`[]

Defined in: analysis/index.ts:51

実行されたプラグインのリスト
