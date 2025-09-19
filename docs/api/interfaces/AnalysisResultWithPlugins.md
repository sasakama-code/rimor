[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / AnalysisResultWithPlugins

# Interface: AnalysisResultWithPlugins

Defined in: [analysis/index.ts:58](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L58)

プラグイン情報を持つ分析結果
プラグインシステムとの統合をサポート

## Extended by

- [`AnalysisResult`](AnalysisResult.md)

## Properties

### pluginResults?

> `optional` **pluginResults**: `Record`\<`string`, `any`\>

Defined in: [analysis/index.ts:62](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L62)

プラグイン固有の結果

***

### pluginsExecuted?

> `optional` **pluginsExecuted**: `string`[]

Defined in: [analysis/index.ts:60](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/analysis/index.ts#L60)

実行されたプラグインのリスト
