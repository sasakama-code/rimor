/**
 * OWASP プラグイン用の型定義
 */

import { QualityDetails } from '../../../core/types/quality-score';

/**
 * Injection プラグイン用の拡張QualityDetails
 */
export interface InjectionQualityDetails extends QualityDetails {
  sqlInjectionCoverage?: number;
  commandInjectionCoverage?: number;
}

/**
 * VulnerableComponents プラグイン用の拡張QualityDetails
 */
export interface VulnerableComponentsQualityDetails extends QualityDetails {
  vulnerabilityScanCoverage?: number;
  dependencyCheckCoverage?: number;
}

/**
 * CryptographicFailures プラグイン用の拡張QualityDetails
 */
export interface CryptographicFailuresQualityDetails extends QualityDetails {
  weakAlgorithmsDetected?: number;
}