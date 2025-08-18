"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeContextUtils = void 0;
/**
 * コードコンテキスト分析ユーティリティ機能
 */
class CodeContextUtils {
    /**
     * 分析の信頼度を計算
     */
    calculateConfidence(fileContent, language) {
        let confidence = 0.5; // ベース信頼度
        // 言語固有の信頼度調整
        if (['typescript', 'javascript'].includes(language)) {
            confidence += 0.3;
        }
        else if (['python', 'java'].includes(language)) {
            confidence += 0.2;
        }
        else if (language === 'unknown') {
            confidence = 0.1;
        }
        // ファイル内容による信頼度調整
        const lines = fileContent.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        // コード量による調整
        if (nonEmptyLines.length > 100) {
            confidence += 0.1;
        }
        else if (nonEmptyLines.length < 10) {
            confidence -= 0.2;
        }
        // コメント率による調整
        const commentLines = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed.startsWith('//') ||
                trimmed.startsWith('/*') ||
                trimmed.startsWith('*') ||
                trimmed.startsWith('#'); // Python comments
        });
        const commentRatio = commentLines.length / nonEmptyLines.length;
        if (commentRatio > 0.2) {
            confidence += 0.1;
        }
        // 構造化コードの検出
        const hasClasses = fileContent.includes('class ');
        const hasFunctions = fileContent.includes('function ') || fileContent.includes('=>');
        const hasInterfaces = fileContent.includes('interface ');
        const hasTypes = fileContent.includes('type ');
        if (hasClasses)
            confidence += 0.1;
        if (hasFunctions)
            confidence += 0.1;
        if (hasInterfaces)
            confidence += 0.05;
        if (hasTypes)
            confidence += 0.05;
        // インポート/エクスポートの存在
        const hasImports = fileContent.includes('import ') || fileContent.includes('require(');
        const hasExports = fileContent.includes('export ') || fileContent.includes('module.exports');
        if (hasImports)
            confidence += 0.05;
        if (hasExports)
            confidence += 0.05;
        // 上限・下限の適用
        return Math.max(0, Math.min(1, confidence));
    }
    /**
     * ファイルの複雑度スコアを計算
     */
    calculateComplexityScore(fileContent) {
        const lines = fileContent.split('\n');
        let complexity = 0;
        // McCabe複雑度に基づく計算
        const complexityPatterns = [
            /\bif\b/g,
            /\belse\b/g,
            /\bfor\b/g,
            /\bwhile\b/g,
            /\bswitch\b/g,
            /\bcase\b/g,
            /\bcatch\b/g,
            /\btry\b/g,
            /&&/g,
            /\|\|/g,
            /\?/g // 三項演算子
        ];
        for (const line of lines) {
            for (const pattern of complexityPatterns) {
                const matches = line.match(pattern);
                if (matches) {
                    complexity += matches.length;
                }
            }
        }
        // ネストレベルによる追加複雑度
        let maxNestLevel = 0;
        let currentNestLevel = 0;
        for (const line of lines) {
            for (const char of line) {
                if (char === '{') {
                    currentNestLevel++;
                    maxNestLevel = Math.max(maxNestLevel, currentNestLevel);
                }
                else if (char === '}') {
                    currentNestLevel--;
                }
            }
        }
        complexity += maxNestLevel * 2;
        return complexity;
    }
    /**
     * コードの品質指標を計算
     */
    calculateQualityMetrics(fileContent, language) {
        const lines = fileContent.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        const linesOfCode = nonEmptyLines.length;
        // コメント率の計算
        const commentLines = lines.filter(line => {
            const trimmed = line.trim();
            return trimmed.startsWith('//') ||
                trimmed.startsWith('/*') ||
                trimmed.startsWith('*') ||
                trimmed.startsWith('#');
        });
        const commentRatio = linesOfCode > 0 ? commentLines.length / linesOfCode : 0;
        // 複雑度の計算
        const complexity = this.calculateComplexityScore(fileContent);
        // 保守性指数の計算（簡略版）
        // Microsoft の Maintainability Index の簡略版
        const halsteadVolume = Math.log2(linesOfCode + 1) * 10; // 簡略化
        const cyclomaticComplexity = Math.max(1, complexity / 10);
        const maintainabilityIndex = Math.max(0, 171 - 5.2 * Math.log(halsteadVolume) - 0.23 * cyclomaticComplexity);
        return {
            linesOfCode,
            commentRatio,
            complexity,
            maintainabilityIndex
        };
    }
    /**
     * テストカバレッジの推定
     */
    estimateTestCoverage(fileContent, relatedTestFiles) {
        if (relatedTestFiles.length === 0) {
            return 0;
        }
        // 関数の数を数える
        const functionMatches = fileContent.match(/function\s+\w+|=>\s*\{|\w+\s*\(/g) || [];
        const functionCount = functionMatches.length;
        if (functionCount === 0) {
            return 0.5; // 関数がない場合の基準値
        }
        // テストファイル数による推定
        let coverage = Math.min(relatedTestFiles.length * 0.3, 0.9);
        // クラスやインターフェースがある場合の調整
        const hasClasses = fileContent.includes('class ');
        const hasInterfaces = fileContent.includes('interface ');
        if (hasClasses || hasInterfaces) {
            coverage *= 1.1; // テスト対象が明確な場合は推定値を上げる
        }
        return Math.min(coverage, 1.0);
    }
    /**
     * ファイルの重要度スコアを計算
     */
    calculateImportanceScore(fileContent, filePath, dependentCount = 0) {
        let score = 0;
        // エクスポートの数による重要度
        const exportMatches = fileContent.match(/export\s+(class|function|const|interface)/g) || [];
        score += exportMatches.length * 0.2;
        // 他のファイルからの依存数
        score += dependentCount * 0.3;
        // ファイル名による重要度判定
        const fileName = filePath.toLowerCase();
        if (fileName.includes('index') || fileName.includes('main')) {
            score += 0.5;
        }
        if (fileName.includes('util') || fileName.includes('helper')) {
            score += 0.3;
        }
        if (fileName.includes('config') || fileName.includes('setting')) {
            score += 0.4;
        }
        // ファイルサイズによる調整
        const linesOfCode = fileContent.split('\n').filter(l => l.trim()).length;
        if (linesOfCode > 500) {
            score += 0.3; // 大きなファイルは重要度が高い
        }
        return Math.min(score, 1.0);
    }
    /**
     * コードの可読性スコアを計算
     */
    calculateReadabilityScore(fileContent) {
        let score = 0.5; // ベーススコア
        const lines = fileContent.split('\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        // 平均行長
        const totalLength = nonEmptyLines.reduce((sum, line) => sum + line.length, 0);
        const avgLineLength = totalLength / nonEmptyLines.length || 0;
        if (avgLineLength < 80) {
            score += 0.2;
        }
        else if (avgLineLength > 120) {
            score -= 0.2;
        }
        // インデントの一貫性
        const indentLevels = nonEmptyLines.map(line => {
            const match = line.match(/^(\s*)/);
            return match ? match[1].length : 0;
        });
        const uniqueIndents = [...new Set(indentLevels)].sort((a, b) => a - b);
        const isConsistentIndent = uniqueIndents.every((indent, i) => {
            if (i === 0)
                return true;
            return indent - uniqueIndents[i - 1] <= 4; // 4スペース以下の差
        });
        if (isConsistentIndent) {
            score += 0.1;
        }
        // 命名規則の一貫性（変数名）
        const variableNames = fileContent.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g) || [];
        const camelCaseCount = variableNames.filter(name => /[a-z][A-Z]/.test(name)).length;
        const snake_caseCount = variableNames.filter(name => /_/.test(name)).length;
        const totalVars = variableNames.length;
        if (totalVars > 0) {
            const consistency = Math.max(camelCaseCount, snake_caseCount) / totalVars;
            score += consistency * 0.2;
        }
        return Math.max(0, Math.min(1, score));
    }
    /**
     * セキュリティリスクスコアを計算
     */
    calculateSecurityRiskScore(fileContent) {
        let riskScore = 0;
        // 潜在的なセキュリティリスクパターン
        const riskPatterns = [
            { pattern: /eval\s*\(/, weight: 0.3 },
            { pattern: /innerHTML\s*=/, weight: 0.2 },
            { pattern: /document\.write/, weight: 0.2 },
            { pattern: /exec\s*\(/, weight: 0.3 },
            { pattern: /system\s*\(/, weight: 0.3 },
            { pattern: /file_get_contents/, weight: 0.2 },
            { pattern: /mysql_query/, weight: 0.25 },
            { pattern: /\$_GET|\$_POST/, weight: 0.15 },
            { pattern: /password\s*=\s*['"]\w+['"]/, weight: 0.4 },
            { pattern: /api[_-]?key\s*=\s*['"]\w+['"]/, weight: 0.4 }
        ];
        for (const { pattern, weight } of riskPatterns) {
            if (pattern.test(fileContent)) {
                riskScore += weight;
            }
        }
        return Math.min(riskScore, 1.0);
    }
    /**
     * パフォーマンス問題の検出
     */
    detectPerformanceIssues(fileContent) {
        const issues = [];
        // ネストしたループの検出
        if (/for\s*\([^}]*for\s*\(/.test(fileContent)) {
            issues.push('ネストしたループが検出されました - パフォーマンスに影響する可能性があります');
        }
        // 大きな配列の操作
        if (/\.map\s*\([^}]*\.map\s*\(/.test(fileContent)) {
            issues.push('連鎖したmap操作 - 効率を改善できる可能性があります');
        }
        // 同期的なファイル操作
        if (/fs\.readFileSync|fs\.writeFileSync/.test(fileContent)) {
            issues.push('同期的なファイル操作 - 非同期版の使用を検討してください');
        }
        // メモリリークの可能性
        if (/setInterval|setTimeout/.test(fileContent) && !/clear/.test(fileContent)) {
            issues.push('タイマーのクリーンアップが不十分な可能性があります');
        }
        return issues;
    }
    /**
     * ベストプラクティス違反の検出
     */
    detectBestPracticeViolations(fileContent, language) {
        const violations = [];
        if (language === 'typescript' || language === 'javascript') {
            // var の使用
            if (/\bvar\s+/.test(fileContent)) {
                violations.push('var の使用は避け、const または let を使用してください');
            }
            // == の使用
            if (/[^=!]==(?!=)/.test(fileContent)) {
                violations.push('厳密等価演算子（===）の使用を推奨します');
            }
            // console.log の本番コード
            if (/console\.log/.test(fileContent) && !fileContent.includes('// debug')) {
                violations.push('本番コードでのconsole.logの使用は避けてください');
            }
            // 長い関数
            const functionBlocks = fileContent.match(/function[^{]*\{[^}]*\}/g) || [];
            const longFunctions = functionBlocks.filter(func => func.split('\n').length > 50);
            if (longFunctions.length > 0) {
                violations.push(`長すぎる関数が${longFunctions.length}個見つかりました`);
            }
        }
        return violations;
    }
    /**
     * 依存関係の循環検出用のヘルパー
     */
    buildDependencyGraph(files) {
        const graph = new Map();
        for (const file of files) {
            graph.set(file.path, file.imports);
        }
        return graph;
    }
    /**
     * ファイルサイズ分析
     */
    analyzeFileSize(fileContent) {
        const bytes = Buffer.byteLength(fileContent, 'utf8');
        const lines = fileContent.split('\n');
        const totalLines = lines.length;
        let codeLines = 0;
        let commentLines = 0;
        let emptyLines = 0;
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '') {
                emptyLines++;
            }
            else if (trimmedLine.startsWith('//') ||
                trimmedLine.startsWith('/*') ||
                trimmedLine.startsWith('*') ||
                trimmedLine.startsWith('#')) {
                commentLines++;
            }
            else {
                codeLines++;
            }
        }
        return {
            bytes,
            lines: totalLines,
            codeLines,
            commentLines,
            emptyLines
        };
    }
}
exports.CodeContextUtils = CodeContextUtils;
//# sourceMappingURL=utils.js.map