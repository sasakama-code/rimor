"use strict";
/**
 * AIJsonFormatter
 * v0.9.0 - Issue #64: レポートシステムの統合
 * REFACTOR段階: BaseFormatterを継承
 *
 * SOLID原則: 単一責任（AI JSON形式の生成のみ）
 * DRY原則: 共通ロジックをBaseFormatterに委譲
 * KISS原則: シンプルなJSON生成
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIJsonFormatter = void 0;
const BaseFormatter_1 = require("./BaseFormatter");
/**
 * AI向けJSON形式のフォーマッター
 * UnifiedAIFormatterStrategyの機能を統合
 * Martin Fowlerの「Replace Inheritance with Delegation」の逆適用
 */
class AIJsonFormatter extends BaseFormatter_1.BaseFormatter {
    name = 'ai-json';
    /**
     * AI向けJSON形式でレポートを生成
     * Template Methodパターンの具体実装
     */
    doFormat(result, options) {
        const { summary, aiKeyRisks = [] } = result;
        // リスクのフィルタリングとソート（ベースクラスのメソッドを使用）
        let filteredRisks = this.filterRisksByLevel(aiKeyRisks, options?.includeRiskLevels);
        filteredRisks = this.sortRisksByPriority(filteredRisks);
        // 最大数で制限
        const maxRisks = this.getMaxRisks(options);
        const topRisks = filteredRisks.slice(0, maxRisks);
        // 全体評価の生成
        const overallAssessment = this.generateOverallAssessment(summary, topRisks);
        // AIJsonOutput形式に変換
        const keyRisks = topRisks.map(risk => ({
            problem: risk.problem || risk.title,
            riskLevel: risk.riskLevel,
            context: {
                filePath: risk.filePath,
                codeSnippet: risk.context?.codeSnippet || '',
                startLine: risk.context?.startLine || 0,
                endLine: risk.context?.endLine || 0
            },
            suggestedAction: this.formatActionObject(risk.suggestedAction)
        }));
        return {
            overallAssessment,
            keyRisks,
            fullReportUrl: options?.htmlReportPath || '.rimor/reports/index.html'
        };
    }
    /**
     * 全体評価を生成
     */
    generateOverallAssessment(summary, risks) {
        if (!summary) {
            return 'プロジェクト分析データが不足しています。';
        }
        const { overallScore, overallGrade, statistics } = summary;
        let assessment = `プロジェクト品質評価結果:\n`;
        assessment += `総合スコア: ${overallScore}/100\n`;
        assessment += `グレード: ${overallGrade}\n\n`;
        if (!risks || risks.length === 0) {
            assessment += `問題は検出されませんでした。\n`;
            assessment += `優秀なコード品質が確認されました。`;
        }
        else {
            const riskCounts = statistics.riskCounts;
            assessment += `リスク統計:\n`;
            if (riskCounts.CRITICAL > 0) {
                assessment += `- CRITICAL: ${riskCounts.CRITICAL}件\n`;
            }
            if (riskCounts.HIGH > 0) {
                assessment += `- HIGH: ${riskCounts.HIGH}件\n`;
            }
            if (riskCounts.MEDIUM > 0) {
                assessment += `- MEDIUM: ${riskCounts.MEDIUM}件\n`;
            }
            if (riskCounts.LOW > 0) {
                assessment += `- LOW: ${riskCounts.LOW}件\n`;
            }
            if (riskCounts.MINIMAL > 0) {
                assessment += `- MINIMAL: ${riskCounts.MINIMAL}件\n`;
            }
            assessment += `\n主要な改善ポイント:\n`;
            const topIssues = risks.slice(0, 3);
            topIssues.forEach((risk, index) => {
                assessment += `${index + 1}. ${risk.problem || risk.title}\n`;
            });
        }
        return assessment;
    }
    /**
     * suggestedActionをオブジェクト形式にフォーマット
     */
    formatActionObject(action) {
        if (!action) {
            return {
                type: 'review',
                description: '改善アクションの検討が必要です'
            };
        }
        if (typeof action === 'string') {
            return {
                type: 'refactor',
                description: action
            };
        }
        const actionObj = action;
        return {
            type: actionObj.type || 'refactor',
            description: actionObj.description || '改善が必要です',
            example: actionObj.example
        };
    }
}
exports.AIJsonFormatter = AIJsonFormatter;
//# sourceMappingURL=AIJsonFormatter.js.map