"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIActionType = exports.RiskLevel = void 0;
const core_definitions_1 = require("../../core/types/core-definitions");
/**
 * UnifiedAnalysisResult v2.0
 * Issue #52: NIST SP 800-30準拠リスク評価機能
 *
 * 後続のレポート機能（#57, #58）が利用する統一データ形式
 * SOLID原則: インターフェース分離の原則に準拠
 */
/**
 * リスクレベルの定義
 * v0.9.0の intent-analyze 機能で導入された大文字の定義を
 * プロジェクトの正式な標準とする
 */
// CoreTypesのRiskLevel enumを再エクスポート
exports.RiskLevel = core_definitions_1.CoreTypes.RiskLevel;
/**
 * AIエージェントへのアクション提案の種別
 */
var AIActionType;
(function (AIActionType) {
    AIActionType["ADD_ASSERTION"] = "ADD_ASSERTION";
    AIActionType["SANITIZE_VARIABLE"] = "SANITIZE_VARIABLE";
    AIActionType["REFACTOR_COMPLEX_CODE"] = "REFACTOR_COMPLEX_CODE";
    AIActionType["ADD_MISSING_TEST"] = "ADD_MISSING_TEST";
})(AIActionType || (exports.AIActionType = AIActionType = {}));
//# sourceMappingURL=unified-analysis-result.js.map