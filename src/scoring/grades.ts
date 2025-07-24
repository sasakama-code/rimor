import { GRADE_THRESHOLDS, GradeType } from './types';

/**
 * グレード判定アルゴリズム
 * スコア（0-100）をA-Fのグレードに変換
 */
export class GradeCalculator {
  /**
   * スコアに基づいてグレードを計算
   * @param score 0-100のスコア値
   * @returns A-Fのグレード
   */
  calculateGrade(score: number): GradeType {
    // スコアを0-100の範囲にクランプ
    const normalizedScore = Math.max(0, Math.min(100, score));

    if (normalizedScore >= GRADE_THRESHOLDS.A) {
      return 'A';
    } else if (normalizedScore >= GRADE_THRESHOLDS.B) {
      return 'B';
    } else if (normalizedScore >= GRADE_THRESHOLDS.C) {
      return 'C';
    } else if (normalizedScore >= GRADE_THRESHOLDS.D) {
      return 'D';
    } else {
      return 'F';
    }
  }

  /**
   * グレードに対応する最小スコアを取得
   * @param grade A-Fのグレード
   * @returns そのグレードに必要な最小スコア
   */
  getMinScoreForGrade(grade: GradeType): number {
    return GRADE_THRESHOLDS[grade];
  }

  /**
   * グレードに対応する色を取得（CLI出力用）
   * @param grade A-Fのグレード
   * @returns ANSIカラーコード
   */
  getGradeColor(grade: GradeType): string {
    switch (grade) {
      case 'A':
        return '\x1b[32m'; // Green
      case 'B':
        return '\x1b[36m'; // Cyan
      case 'C':
        return '\x1b[33m'; // Yellow
      case 'D':
        return '\x1b[35m'; // Magenta
      case 'F':
        return '\x1b[31m'; // Red
      default:
        return '\x1b[0m';  // Reset
    }
  }

  /**
   * グレードの説明を取得
   * @param grade A-Fのグレード
   * @returns グレードの説明文
   */
  getGradeDescription(grade: GradeType): string {
    switch (grade) {
      case 'A':
        return '優秀';
      case 'B':
        return '良好';
      case 'C':
        return '標準';
      case 'D':
        return '要改善';
      case 'F':
        return '不合格';
      default:
        return '不明';
    }
  }

  /**
   * スコア分布からグレード分布を計算
   * @param scores スコアの配列
   * @returns グレード別のファイル数
   */
  calculateGradeDistribution(scores: number[]): Record<GradeType, number> {
    const distribution: Record<GradeType, number> = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0
    };

    for (const score of scores) {
      const grade = this.calculateGrade(score);
      distribution[grade]++;
    }

    return distribution;
  }

  /**
   * グレード分布から百分率を計算
   * @param distribution グレード分布
   * @returns グレード別の百分率
   */
  calculateGradePercentages(distribution: Record<GradeType, number>): Record<GradeType, number> {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
      return { A: 0, B: 0, C: 0, D: 0, F: 0 };
    }

    const percentages: Record<GradeType, number> = {
      A: Math.round((distribution.A / total) * 100 * 10) / 10,
      B: Math.round((distribution.B / total) * 100 * 10) / 10,
      C: Math.round((distribution.C / total) * 100 * 10) / 10,
      D: Math.round((distribution.D / total) * 100 * 10) / 10,
      F: Math.round((distribution.F / total) * 100 * 10) / 10
    };

    return percentages;
  }

  /**
   * 目標グレードに必要な改善点数を計算
   * @param currentScore 現在のスコア
   * @param targetGrade 目標グレード
   * @returns 必要な改善点数（達成済みの場合は0）
   */
  calculateImprovementNeeded(currentScore: number, targetGrade: GradeType): number {
    const targetScore = this.getMinScoreForGrade(targetGrade);
    const improvement = targetScore - currentScore;
    return Math.max(0, improvement);
  }

  /**
   * グレードが改善されたかどうかを判定
   * @param previousGrade 前回のグレード
   * @param currentGrade 現在のグレード
   * @returns 改善レベル（-2: 大幅悪化, -1: 悪化, 0: 変化なし, 1: 改善, 2: 大幅改善）
   */
  compareGrades(previousGrade: GradeType, currentGrade: GradeType): number {
    const gradeOrder: Record<GradeType, number> = { F: 0, D: 1, C: 2, B: 3, A: 4 };
    
    const previousOrder = gradeOrder[previousGrade];
    const currentOrder = gradeOrder[currentGrade];
    const difference = currentOrder - previousOrder;

    if (difference >= 2) return 2;  // 大幅改善
    if (difference === 1) return 1; // 改善
    if (difference === 0) return 0; // 変化なし
    if (difference === -1) return -1; // 悪化
    return -2; // 大幅悪化
  }
}