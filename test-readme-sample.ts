// README.mdの修正されたサンプルコードをテスト（型安全性確認用）
import { UnifiedAnalysisEngine } from './src/core/UnifiedAnalysisEngine';

async function testFixedREADMESample() {
  try {
    const engine = new UnifiedAnalysisEngine();

    // Implementation Truth分析の実行（v0.9.0）
    const result = await engine.analyzeWithImplementationTruth('./src');

    // 実装の真実を確立
    const implementationTruth = result.implementationTruth;
    console.log(`検出された脆弱性: ${implementationTruth.vulnerabilities.length}`);

    // 意図実現度の評価
    const intentRealizationResults = result.intentRealizationResults;
    console.log(`実装と意図のギャップ: ${intentRealizationResults.length}`);

    // 改善提案の確認
    result.summary.topRecommendations.forEach(recommendation => {
      console.log(`推奨: ${recommendation}`);
    });

    console.log('✅ 型安全性チェック: 成功');
  } catch (error) {
    console.error('❌ 分析エラー:', error);
  }
}

testFixedREADMESample();