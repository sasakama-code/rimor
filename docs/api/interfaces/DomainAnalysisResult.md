[**Rimor API Documentation v0.8.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / DomainAnalysisResult

# Interface: DomainAnalysisResult

Defined in: domain/index.ts:220

ドメイン分析結果

## Properties

### issues

> **issues**: `object`[]

Defined in: domain/index.ts:230

問題点

#### location?

> `optional` **location**: `string`

#### message

> **message**: `string`

#### severity

> **severity**: `"HIGH"` \| `"MEDIUM"` \| `"LOW"`

#### type

> **type**: `"MISSING_ENTITY"` \| `"AMBIGUOUS_TERM"` \| `"CIRCULAR_DEPENDENCY"` \| `"VIOLATION"`

***

### metrics

> **metrics**: `object`

Defined in: domain/index.ts:239

メトリクス

#### cohesion

> **cohesion**: `number`

#### complexityScore

> **complexityScore**: `number`

#### coupling

> **coupling**: `number`

#### entityCount

> **entityCount**: `number`

#### eventCount

> **eventCount**: `number`

#### serviceCount

> **serviceCount**: `number`

***

### model

> **model**: [`DomainModel`](DomainModel.md)

Defined in: domain/index.ts:222

モデル

***

### patterns

> **patterns**: `object`[]

Defined in: domain/index.ts:224

検出されたパターン

#### confidence

> **confidence**: `number`

#### location

> **location**: `string`

#### type

> **type**: [`DomainPattern`](../type-aliases/DomainPattern.md)

***

### recommendations

> **recommendations**: `string`[]

Defined in: domain/index.ts:237

推奨事項
