[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / PluginResult

# Interface: PluginResult

Defined in: [plugins/index.ts:239](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L239)

プラグイン実行結果

## Properties

### data?

> `optional` **data**: `unknown`

Defined in: [plugins/index.ts:245](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L245)

結果データ

***

### error?

> `optional` **error**: `Error`

Defined in: [plugins/index.ts:247](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L247)

エラー

***

### executionTime

> **executionTime**: `number`

Defined in: [plugins/index.ts:249](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L249)

実行時間

***

### metrics?

> `optional` **metrics**: `Record`\<`string`, `any`\>

Defined in: [plugins/index.ts:251](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L251)

メトリクス

***

### pluginName

> **pluginName**: `string`

Defined in: [plugins/index.ts:241](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L241)

プラグイン名

***

### success

> **success**: `boolean`

Defined in: [plugins/index.ts:243](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L243)

成功/失敗
