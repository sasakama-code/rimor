[**Rimor API Documentation v0.9.0**](../README.md)

***

[Rimor API Documentation](../globals.md) / calculateTestSuiteSummary

# Function: calculateTestSuiteSummary()

> **calculateTestSuiteSummary**(`testCases`): `undefined` \| \{ `executionTime?`: `number`; `failed`: `number`; `passed`: `number`; `pending`: `number`; `skipped`: `number`; `total`: `number`; \}

Defined in: [testing/index.ts:310](https://github.com/sasakama-code/rimor/blob/0d428f9bf9f700bab9c108eb64db95ded6548e2e/src/types/testing/index.ts#L310)

ヘルパー関数: テストスイートのサマリーを計算

## Parameters

### testCases

[`TestCase`](../interfaces/TestCase.md)[]

## Returns

`undefined` \| \{ `executionTime?`: `number`; `failed`: `number`; `passed`: `number`; `pending`: `number`; `skipped`: `number`; `total`: `number`; \}
