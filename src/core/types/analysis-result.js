"use strict";
/**
 * Analysis result types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAnalysisResult = isAnalysisResult;
// Type guard for AnalysisResult
function isAnalysisResult(value) {
    if (!value || typeof value !== 'object')
        return false;
    const result = value;
    // Check required fields
    if (typeof result.projectRoot !== 'string')
        return false;
    // timestamp can be Date or string
    if (!(result.timestamp instanceof Date) && typeof result.timestamp !== 'string')
        return false;
    if (!Array.isArray(result.results))
        return false;
    // Check summary
    if (!result.summary || typeof result.summary !== 'object')
        return false;
    const summary = result.summary;
    if (typeof summary.totalFiles !== 'number')
        return false;
    if (typeof summary.filesWithIssues !== 'number')
        return false;
    if (typeof summary.totalIssues !== 'number')
        return false;
    return true;
}
//# sourceMappingURL=analysis-result.js.map