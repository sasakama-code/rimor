[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / PluginConfig

# Interface: PluginConfig

Defined in: [plugins/index.ts:61](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L61)

プラグイン設定

## Properties

### enabled

> **enabled**: `boolean`

Defined in: [plugins/index.ts:63](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L63)

有効/無効

***

### excludePatterns?

> `optional` **excludePatterns**: `string`[]

Defined in: [plugins/index.ts:69](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L69)

除外パターン

***

### includePatterns?

> `optional` **includePatterns**: `string`[]

Defined in: [plugins/index.ts:71](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L71)

含めるパターン

***

### options?

> `optional` **options**: `Record`\<`string`, `any`\>

Defined in: [plugins/index.ts:67](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L67)

オプション

***

### priority?

> `optional` **priority**: [`PluginPriority`](../type-aliases/PluginPriority.md)

Defined in: [plugins/index.ts:65](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/plugins/index.ts#L65)

優先度
