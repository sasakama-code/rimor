"use strict";
/**
 * コア型定義 - プロジェクト全体で使用される統一型定義
 *
 * このファイルは型定義の一元管理を目的としています。
 * 全てのモジュールはこのファイルから型をインポートしてください。
 *
 * @since v0.9.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeUtils = exports.TypeGuards = exports.CoreTypes = void 0;
/**
 * CoreTypes名前空間
 * プロジェクト全体で共通使用される型定義を集約
 */
var CoreTypes;
(function (CoreTypes) {
    /**
     * リスクレベル - セキュリティや品質リスクの深刻度
     * CRITICAL > HIGH > MEDIUM > LOW > MINIMAL の順で深刻度が高い
     */
    let RiskLevel;
    (function (RiskLevel) {
        RiskLevel["CRITICAL"] = "CRITICAL";
        RiskLevel["HIGH"] = "HIGH";
        RiskLevel["MEDIUM"] = "MEDIUM";
        RiskLevel["LOW"] = "LOW";
        RiskLevel["MINIMAL"] = "MINIMAL";
    })(RiskLevel = CoreTypes.RiskLevel || (CoreTypes.RiskLevel = {}));
})(CoreTypes || (exports.CoreTypes = CoreTypes = {}));
/**
 * 型ガード関数
 */
var TypeGuards;
(function (TypeGuards) {
    function isRiskLevel(value) {
        return Object.values(CoreTypes.RiskLevel).includes(value);
    }
    TypeGuards.isRiskLevel = isRiskLevel;
    function isSeverityLevel(value) {
        return ['critical', 'high', 'medium', 'low', 'info'].includes(value);
    }
    TypeGuards.isSeverityLevel = isSeverityLevel;
    function isIssue(value) {
        return value &&
            typeof value.id === 'string' &&
            typeof value.type === 'string' &&
            isSeverityLevel(value.severity) &&
            typeof value.message === 'string';
    }
    TypeGuards.isIssue = isIssue;
    function isRiskAssessment(value) {
        return value &&
            isRiskLevel(value.riskLevel) &&
            typeof value.category === 'string' &&
            typeof value.description === 'string';
    }
    TypeGuards.isRiskAssessment = isRiskAssessment;
})(TypeGuards || (exports.TypeGuards = TypeGuards = {}));
/**
 * ユーティリティ関数
 */
var TypeUtils;
(function (TypeUtils) {
    /**
     * RiskLevelを数値に変換（比較用）
     */
    function riskLevelToNumber(level) {
        const mapping = {
            [CoreTypes.RiskLevel.CRITICAL]: 5,
            [CoreTypes.RiskLevel.HIGH]: 4,
            [CoreTypes.RiskLevel.MEDIUM]: 3,
            [CoreTypes.RiskLevel.LOW]: 2,
            [CoreTypes.RiskLevel.MINIMAL]: 1
        };
        return mapping[level];
    }
    TypeUtils.riskLevelToNumber = riskLevelToNumber;
    /**
     * SeverityLevelを数値に変換（比較用）
     */
    function severityLevelToNumber(level) {
        const mapping = {
            'critical': 4,
            'error': 3, // errorはhighと同等
            'high': 3,
            'warning': 2, // warningはmediumと同等
            'medium': 2,
            'low': 1,
            'info': 0
        };
        return mapping[level];
    }
    TypeUtils.severityLevelToNumber = severityLevelToNumber;
    /**
     * リスクレベルの比較
     */
    function compareRiskLevels(a, b) {
        return riskLevelToNumber(b) - riskLevelToNumber(a);
    }
    TypeUtils.compareRiskLevels = compareRiskLevels;
    /**
     * 重要度レベルの比較
     */
    function compareSeverityLevels(a, b) {
        return severityLevelToNumber(b) - severityLevelToNumber(a);
    }
    TypeUtils.compareSeverityLevels = compareSeverityLevels;
})(TypeUtils || (exports.TypeUtils = TypeUtils = {}));
//# sourceMappingURL=core-definitions.js.map