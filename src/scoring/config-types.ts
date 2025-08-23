/**
 * Scoring configuration types
 */

import { GradeType, WeightConfig } from './types';

/**
 * Legacy configuration structure for backward compatibility
 */
export interface LegacyConfig {
  plugins?: Record<string, {
    weight?: number;
    [key: string]: unknown;
  }>;
  quality?: {
    thresholds?: {
      excellent?: number;
      good?: number;
      acceptable?: number;
      poor?: number;
    };
    strictMode?: boolean;
  };
  strictMode?: boolean;
  scoring?: {
    enabled?: boolean;
    weights?: Partial<WeightConfig>;
    gradeThresholds?: Partial<Record<GradeType, number>>;
    options?: {
      enableTrends?: boolean;
      enablePredictions?: boolean;
      cacheResults?: boolean;
      reportFormat?: 'detailed' | 'summary' | 'minimal';
    };
  };
  [key: string]: unknown;
}

/**
 * JSON value types for safe parsing
 */
export type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonObject 
  | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface JsonArray extends Array<JsonValue> {}

/**
 * Configuration object after sanitization
 */
export interface SanitizedConfig {
  [key: string]: JsonValue;
}

/**
 * Partial scoring configuration from rimor.config.json
 */
export interface PartialScoringConfig {
  enabled?: boolean;
  weights?: {
    plugins?: Record<string, number>;
    dimensions?: Partial<Record<string, number>>;
  };
  gradeThresholds?: Partial<Record<GradeType, number>>;
  options?: {
    enableTrends?: boolean;
    enablePredictions?: boolean;
    cacheResults?: boolean;
    reportFormat?: 'detailed' | 'summary' | 'minimal';
  };
}

/**
 * Type guards
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && 
         value !== null && 
         !Array.isArray(value);
}

export function isJsonArray(value: unknown): value is JsonArray {
  return Array.isArray(value);
}

export function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true;
  if (typeof value === 'string') return true;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;
  if (isJsonObject(value)) {
    return Object.values(value).every(isJsonValue);
  }
  if (isJsonArray(value)) {
    return value.every(isJsonValue);
  }
  return false;
}

export function isLegacyConfig(value: unknown): value is LegacyConfig {
  if (!isJsonObject(value)) return false;
  const config = value as Record<string, unknown>;
  
  // Check optional properties have correct types
  if (config.plugins !== undefined && !isJsonObject(config.plugins)) return false;
  if (config.quality !== undefined && !isJsonObject(config.quality)) return false;
  if (config.strictMode !== undefined && typeof config.strictMode !== 'boolean') return false;
  if (config.scoring !== undefined && !isJsonObject(config.scoring)) return false;
  
  return true;
}

export function isPartialScoringConfig(value: unknown): value is PartialScoringConfig {
  if (!isJsonObject(value)) return false;
  const config = value as Record<string, unknown>;
  
  if (config.enabled !== undefined && typeof config.enabled !== 'boolean') return false;
  if (config.weights !== undefined && !isJsonObject(config.weights)) return false;
  if (config.gradeThresholds !== undefined && !isJsonObject(config.gradeThresholds)) return false;
  if (config.options !== undefined && !isJsonObject(config.options)) return false;
  
  return true;
}