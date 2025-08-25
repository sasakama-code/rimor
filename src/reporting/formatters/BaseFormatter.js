"use strict";
/**
 * BaseFormatter
 * v0.9.0 - Issue #64: REFACTOR段階
 * Martin Fowlerの手法による共通ロジックの抽出
 *
 * SOLID原則: 単一責任（基本フォーマット機能）
 * DRY原則: 共通ロジックの一元化
 * Template Methodパターン: 共通処理とカスタマイズポイントの分離
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseFormatter = void 0;
/**
 * フォーマッター基底クラス
 * Martin Fowlerの「Pull Up Method」リファクタリング適用
 */
class BaseFormatter {
    // リスクレベルの優先度マップ（共通）
    riskPriorityMap = {
        'CRITICAL': 5,
        'HIGH': 4,
        'MEDIUM': 3,
        'LOW': 2,
        'MINIMAL': 1
    };
    // リスクレベルのラベル（共通）
    riskLevelLabels = {
        'CRITICAL': 'CRITICAL',
        'HIGH': 'HIGH',
        'MEDIUM': 'MEDIUM',
        'LOW': 'LOW',
        'MINIMAL': 'MINIMAL'
    };
    /**
     * Template Methodパターン: フォーマット処理の共通フロー
     */
    format(result, options) {
        // 入力検証（共通）
        this.validateInput(result);
        // 前処理（オプション）
        const preprocessed = this.preprocess(result, options);
        // 具体的なフォーマット処理（サブクラスで実装）
        const formatted = this.doFormat(preprocessed, options);
        // 後処理（オプション）
        return this.postprocess(formatted, options);
    }
    /**
     * 非同期版のフォーマット処理
     */
    async formatAsync(result, options) {
        return this.format(result, options);
    }
    /**
     * 入力検証（共通）
     * Defensive Programming: 不正な入力を早期に検出
     */
    validateInput(result) {
        if (!result) {
            throw new Error('Invalid analysis result: result is null or undefined');
        }
        if (!result.summary) {
            throw new Error('Invalid analysis result: summary is missing');
        }
        if (!result.schemaVersion) {
            throw new Error('Invalid analysis result: schemaVersion is missing');
        }
    }
    /**
     * 前処理（オプション、サブクラスでオーバーライド可能）
     */
    preprocess(result, options) {
        return result;
    }
    /**
     * 後処理（オプション、サブクラスでオーバーライド可能）
     */
    postprocess(formatted, options) {
        return formatted;
    }
    /**
     * リスクのソート（共通）
     * Martin Fowlerの「Extract Method」リファクタリング適用
     */
    sortRisksByPriority(risks) {
        return [...risks].sort((a, b) => {
            const priorityA = this.riskPriorityMap[a.riskLevel] || 0;
            const priorityB = this.riskPriorityMap[b.riskLevel] || 0;
            return priorityB - priorityA;
        });
    }
    /**
     * リスクのフィルタリング（共通）
     */
    filterRisksByLevel(risks, levels) {
        if (!levels || levels.length === 0) {
            return risks;
        }
        return risks.filter(risk => levels.includes(risk.riskLevel));
    }
    /**
     * リスク統計の計算（共通）
     */
    calculateRiskStatistics(risks) {
        const stats = {
            CRITICAL: 0,
            HIGH: 0,
            MEDIUM: 0,
            LOW: 0,
            MINIMAL: 0
        };
        risks.forEach(risk => {
            if (stats[risk.riskLevel] !== undefined) {
                stats[risk.riskLevel]++;
            }
        });
        return stats;
    }
    /**
     * サマリー情報のフォーマット（共通）
     */
    formatSummaryInfo(summary) {
        return {
            score: summary.overallScore,
            grade: summary.overallGrade,
            fileCount: summary.statistics.totalFiles,
            testCount: summary.statistics.totalTests || 0
        };
    }
    /**
     * リスクレベルのテキスト表現を取得（共通）
     */
    getRiskLevelText(level) {
        return this.riskLevelLabels[level] || level;
    }
    /**
     * 推奨アクションのフォーマット（共通）
     */
    formatSuggestedAction(action) {
        if (!action) {
            return '改善アクションの検討が必要です';
        }
        if (typeof action === 'string') {
            return action;
        }
        const actionObj = action;
        if (actionObj && actionObj.description) {
            return actionObj.description;
        }
        return JSON.stringify(action);
    }
    /**
     * タイムスタンプの生成（共通）
     */
    generateTimestamp() {
        return new Date().toISOString();
    }
    /**
     * ローカライズされた日時の生成（共通）
     */
    generateLocalizedDateTime(locale = 'ja-JP') {
        return new Date().toLocaleString(locale);
    }
    /**
     * HTMLエスケープ（HTML系フォーマッター用）
     */
    escapeHtml(text) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return text.replace(/[&<>"']/g, char => escapeMap[char] || char);
    }
    /**
     * 最大リスク数の取得（共通）
     */
    getMaxRisks(options) {
        const maxRisks = options?.maxRisks || 10;
        return Math.min(maxRisks, 100); // 最大100件に制限
    }
}
exports.BaseFormatter = BaseFormatter;
//# sourceMappingURL=BaseFormatter.js.map