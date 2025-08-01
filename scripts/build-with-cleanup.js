#!/usr/bin/env node

/**
 * TypeScriptビルドプロセスにクリーンアップ機能を統合
 * コンパイルエラーが発生した場合、問題のあるファイルを自動削除して再試行
 */

import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ES Modulesスタイルのimportをrequireで代替
const cleanupManagerPath = path.join(__dirname, '../dist/utils/cleanupManager.js');

async function buildWithCleanup() {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount <= maxRetries) {
    try {
      console.log(`🔨 TypeScriptビルドを実行中... (試行: ${retryCount + 1}/${maxRetries + 1})`);
      
      // TypeScriptコンパイルを実行
      const result = spawnSync('tsc', [], {
        cwd: process.cwd(),
        encoding: 'utf8'
      });
      
      if (result.status !== 0) {
        // エラーの場合は例外を投げる
        const error = new Error(`TypeScript compilation failed`);
        error.stdout = result.stdout || '';
        error.stderr = result.stderr || '';
        throw error;
      }
      
      console.log('✅ TypeScriptビルドが正常に完了しました');
      return; // 成功時は終了
      
    } catch (error) {
      console.log(`❌ TypeScriptビルドでエラーが発生しました (試行: ${retryCount + 1})`);
      
      // エラーメッセージを取得（stderrも含める）
      const errorMessage = error.message || error.toString();
      let fullErrorOutput = errorMessage;
      
      if (error.stderr) {
        fullErrorOutput += '\n' + error.stderr.toString();
      }
      if (error.stdout) {
        fullErrorOutput += '\n' + error.stdout.toString();
      }
      
      console.log('🔍 エラー詳細:', fullErrorOutput.substring(0, 500)); // 最初の500文字を表示
      
      if (retryCount >= maxRetries) {
        console.error('💥 最大試行回数に達しました。ビルドを中止します');
        process.exit(1);
      }
      
      // saved-plugin.tsの問題を検出（より広範囲なエラーパターンに対応）
      if (fullErrorOutput.includes('src/plugins/generated/saved-plugin.ts') || 
          (fullErrorOutput.includes('saved-plugin.ts') && (fullErrorOutput.includes('Cannot find name') || fullErrorOutput.includes('TS2552') || fullErrorOutput.includes('TS2304')))) {
        console.log('🗑️  問題のあるプラグインファイルを削除中...');
        
        try {
          const savedPluginPath = path.join(process.cwd(), 'src/plugins/generated/saved-plugin.ts');
          
          if (fs.existsSync(savedPluginPath)) {
            fs.unlinkSync(savedPluginPath);
            console.log('✅ src/plugins/generated/saved-plugin.ts を削除しました');
          }
          
          // generated ディレクトリの他の問題ファイルもチェック
          const generatedDir = path.join(process.cwd(), 'src/plugins/generated');
          if (fs.existsSync(generatedDir)) {
            const files = fs.readdirSync(generatedDir);
            for (const file of files) {
              if (file.endsWith('.ts') && errorMessage.includes(file)) {
                const problematicFile = path.join(generatedDir, file);
                fs.unlinkSync(problematicFile);
                console.log(`✅ 問題のあるファイルを削除: ${file}`);
              }
            }
          }
          
        } catch (cleanupError) {
          console.error('⚠️  ファイル削除中にエラーが発生:', cleanupError.message);
        }
        
        retryCount++;
        console.log('🔄 ビルドを再試行します...');
        continue;
      }
      
      // その他のプラグインファイルエラーがある場合は警告表示
      if (fullErrorOutput.includes('src/plugins/generated/') && fullErrorOutput.includes('.ts')) {
        console.log('⚠️  プラグインファイルでコンパイルエラーが発生しています');
        console.log('💡 ユーザー作成ファイルの可能性があるため、自動削除は行いません');
        console.log('📝 以下のファイルを確認し、必要に応じて手動で修正してください：');
        
        // エラーのあるファイルを抽出して表示
        const pluginErrorFiles = fullErrorOutput.match(/src\/plugins\/generated\/[^:]+\.ts/g);
        if (pluginErrorFiles) {
          const uniqueFiles = [...new Set(pluginErrorFiles)];
          uniqueFiles.forEach(file => {
            console.log(`   - ${file}`);
          });
        }
      }
      
      // その他のエラーの場合は即座に終了
      console.error('💥 回復不可能なビルドエラーです');
      console.error('エラー詳細:', fullErrorOutput.substring(0, 200));
      process.exit(1);
    }
  }
}

// スクリプト実行
buildWithCleanup().catch(error => {
  console.error('💥 ビルドスクリプトでエラーが発生しました:', error);
  process.exit(1);
});

export { buildWithCleanup };