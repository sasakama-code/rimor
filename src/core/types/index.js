"use strict";
/**
 * Central export point for all type definitions
 * This file provides both granular and aggregated exports for flexibility
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIGRATION_GUIDE_URL = exports.TYPE_DEFINITIONS_VERSION = exports.isAnalysisResult = exports.isQualityScore = exports.isITestQualityPlugin = exports.isIPlugin = exports.isProjectContext = exports.isDetectionResult = exports.isTestFile = exports.isIssue = exports.isValidImprovementArray = exports.isValidDetectionResultArray = exports.isValidIssueArray = exports.isValidArray = exports.isValidImprovement = exports.isValidQualityScore = exports.isValidDetectionResult = exports.isValidIssue = exports.isValidTestFile = exports.isValidProjectContext = exports.isValidASTNode = exports.isValidPackageJson = void 0;
// Base types
__exportStar(require("./base-types"), exports);
// Project context types
__exportStar(require("./project-context"), exports);
// Plugin interface types
__exportStar(require("./plugin-interface"), exports);
// Analysis result types
__exportStar(require("./analysis-result"), exports);
// Quality score types
__exportStar(require("./quality-score"), exports);
// Improvement types
__exportStar(require("./improvements"), exports);
// Domain dictionary types
__exportStar(require("./domain-dictionary"), exports);
// Handler types (コールバック・ハンドラー用型定義)
__exportStar(require("./handler-types"), exports);
// Type guards
__exportStar(require("./type-guards"), exports);
// Note: These re-exports are already handled by export * above,
// but we list them here for clarity and documentation purposes
// Export type guards
var type_guards_1 = require("./type-guards");
Object.defineProperty(exports, "isValidPackageJson", { enumerable: true, get: function () { return type_guards_1.isValidPackageJson; } });
Object.defineProperty(exports, "isValidASTNode", { enumerable: true, get: function () { return type_guards_1.isValidASTNode; } });
Object.defineProperty(exports, "isValidProjectContext", { enumerable: true, get: function () { return type_guards_1.isValidProjectContext; } });
Object.defineProperty(exports, "isValidTestFile", { enumerable: true, get: function () { return type_guards_1.isValidTestFile; } });
Object.defineProperty(exports, "isValidIssue", { enumerable: true, get: function () { return type_guards_1.isValidIssue; } });
Object.defineProperty(exports, "isValidDetectionResult", { enumerable: true, get: function () { return type_guards_1.isValidDetectionResult; } });
Object.defineProperty(exports, "isValidQualityScore", { enumerable: true, get: function () { return type_guards_1.isValidQualityScore; } });
Object.defineProperty(exports, "isValidImprovement", { enumerable: true, get: function () { return type_guards_1.isValidImprovement; } });
Object.defineProperty(exports, "isValidArray", { enumerable: true, get: function () { return type_guards_1.isValidArray; } });
Object.defineProperty(exports, "isValidIssueArray", { enumerable: true, get: function () { return type_guards_1.isValidIssueArray; } });
Object.defineProperty(exports, "isValidDetectionResultArray", { enumerable: true, get: function () { return type_guards_1.isValidDetectionResultArray; } });
Object.defineProperty(exports, "isValidImprovementArray", { enumerable: true, get: function () { return type_guards_1.isValidImprovementArray; } });
// Aliases for backward compatibility
Object.defineProperty(exports, "isIssue", { enumerable: true, get: function () { return type_guards_1.isIssue; } });
Object.defineProperty(exports, "isTestFile", { enumerable: true, get: function () { return type_guards_1.isTestFile; } });
Object.defineProperty(exports, "isDetectionResult", { enumerable: true, get: function () { return type_guards_1.isDetectionResult; } });
Object.defineProperty(exports, "isProjectContext", { enumerable: true, get: function () { return type_guards_1.isProjectContext; } });
// Export plugin type guards
var plugin_interface_1 = require("./plugin-interface");
Object.defineProperty(exports, "isIPlugin", { enumerable: true, get: function () { return plugin_interface_1.isIPlugin; } });
Object.defineProperty(exports, "isITestQualityPlugin", { enumerable: true, get: function () { return plugin_interface_1.isITestQualityPlugin; } });
// Export quality score type guard
var quality_score_1 = require("./quality-score");
Object.defineProperty(exports, "isQualityScore", { enumerable: true, get: function () { return quality_score_1.isQualityScore; } });
// Export analysis result type guard
var analysis_result_1 = require("./analysis-result");
Object.defineProperty(exports, "isAnalysisResult", { enumerable: true, get: function () { return analysis_result_1.isAnalysisResult; } });
// Version info for migration support
exports.TYPE_DEFINITIONS_VERSION = '2.0.0';
exports.MIGRATION_GUIDE_URL = 'https://github.com/rimor/docs/migration-v2';
// Default export for convenience
exports.default = {
    VERSION: exports.TYPE_DEFINITIONS_VERSION,
    MIGRATION_GUIDE: exports.MIGRATION_GUIDE_URL
};
//# sourceMappingURL=index.js.map