#!/usr/bin/env node

/**
 * 循環依存検出スクリプト
 * 
 * 用途:
 * - TypeScript/JavaScriptコードの循環依存を検出
 * - import/exportの依存関係を解析
 * - 循環依存の解消提案を生成
 */

const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(process.cwd(), '.rimor', 'reports', 'dependencies');
const DEPS_FILE = path.join(REPORTS_DIR, 'circular-deps.json');
const SUMMARY_FILE = path.join(REPORTS_DIR, 'circular-deps-summary.md');

// 依存関係グラフ
const dependencyGraph = {};
// 循環依存リスト
const circularDeps = [];
// 訪問済みノード
const visited = new Set();
// 現在のパススタック
const pathStack = [];

/**
 * メイン実行関数
 */
async function main() {
  console.log('🔄 循環依存検出を開始\n');
  
  // レポートディレクトリを作成
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  // 依存関係グラフを構築
  buildDependencyGraph();
  
  // 循環依存を検出
  detectCircularDependencies();
  
  // 結果を保存
  saveResults();
  
  // サマリーを生成
  generateSummary();
  
  // 結果を表示
  displayResults();
  
  // 循環依存がある場合はエラー終了
  process.exit(circularDeps.length > 0 ? 1 : 0);
}

/**
 * 依存関係グラフを構築
 */
function buildDependencyGraph() {
  console.log('📦 依存関係を解析中...');
  
  const srcPath = path.join(process.cwd(), 'src');
  const files = getAllSourceFiles(srcPath);
  
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const dependencies = extractDependencies(file);
    dependencyGraph[relativePath] = dependencies;
  }
  
  console.log(`  解析ファイル数: ${files.length}`);
  console.log(`  依存関係数: ${Object.values(dependencyGraph).flat().length}\n`);
}

/**
 * ファイルから依存関係を抽出
 */
function extractDependencies(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const dependencies = new Set();
  const fileDir = path.dirname(filePath);
  
  // import文を解析
  const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // 相対パスのimportのみを対象とする
    if (importPath.startsWith('.')) {
      const resolvedPath = resolveImportPath(fileDir, importPath);
      if (resolvedPath) {
        const relativePath = path.relative(process.cwd(), resolvedPath);
        dependencies.add(relativePath);
      }
    }
  }
  
  // require文も解析
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  
  while ((match = requireRegex.exec(content)) !== null) {
    const requirePath = match[1];
    
    if (requirePath.startsWith('.')) {
      const resolvedPath = resolveImportPath(fileDir, requirePath);
      if (resolvedPath) {
        const relativePath = path.relative(process.cwd(), resolvedPath);
        dependencies.add(relativePath);
      }
    }
  }
  
  return Array.from(dependencies);
}

/**
 * importパスを解決
 */
function resolveImportPath(fromDir, importPath) {
  const possiblePaths = [
    path.join(fromDir, importPath),
    path.join(fromDir, importPath + '.ts'),
    path.join(fromDir, importPath + '.tsx'),
    path.join(fromDir, importPath + '.js'),
    path.join(fromDir, importPath + '.jsx'),
    path.join(fromDir, importPath, 'index.ts'),
    path.join(fromDir, importPath, 'index.tsx'),
    path.join(fromDir, importPath, 'index.js'),
    path.join(fromDir, importPath, 'index.jsx')
  ];
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }
  
  return null;
}

/**
 * 循環依存を検出
 */
function detectCircularDependencies() {
  console.log('🔍 循環依存を検出中...');
  
  for (const node in dependencyGraph) {
    if (!visited.has(node)) {
      detectCycle(node);
    }
  }
  
  console.log(`  循環依存数: ${circularDeps.length}\n`);
}

/**
 * DFSで循環を検出
 */
function detectCycle(node) {
  visited.add(node);
  pathStack.push(node);
  
  const dependencies = dependencyGraph[node] || [];
  
  for (const dep of dependencies) {
    // 現在のパスに存在する場合、循環依存
    const cycleIndex = pathStack.indexOf(dep);
    if (cycleIndex !== -1) {
      const cycle = pathStack.slice(cycleIndex).concat(dep);
      
      // 重複を避けるため、正規化した循環をチェック
      const normalizedCycle = normalizeCycle(cycle);
      if (!isCircularDepRecorded(normalizedCycle)) {
        circularDeps.push({
          cycle: normalizedCycle,
          files: cycle.length - 1,
          severity: calculateSeverity(cycle)
        });
      }
    } else if (!visited.has(dep)) {
      detectCycle(dep);
    }
  }
  
  pathStack.pop();
}

/**
 * 循環を正規化（最小の要素から始まるように）
 */
function normalizeCycle(cycle) {
  const cycleWithoutLast = cycle.slice(0, -1); // 最後の重複を削除
  const minIndex = cycleWithoutLast.indexOf(Math.min(...cycleWithoutLast));
  return cycleWithoutLast.slice(minIndex).concat(cycleWithoutLast.slice(0, minIndex));
}

/**
 * 循環依存が既に記録されているかチェック
 */
function isCircularDepRecorded(normalizedCycle) {
  return circularDeps.some(dep => 
    JSON.stringify(dep.cycle) === JSON.stringify(normalizedCycle)
  );
}

/**
 * 循環の重要度を計算
 */
function calculateSeverity(cycle) {
  const length = cycle.length - 1;
  
  if (length === 2) {
    return 'high'; // 直接的な相互依存
  } else if (length <= 4) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * ソースファイルを再帰的に取得
 */
function getAllSourceFiles(dirPath) {
  const files = [];
  
  if (!fs.existsSync(dirPath)) {
    return files;
  }
  
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      // node_modulesやdistはスキップ
      if (item !== 'node_modules' && item !== 'dist' && item !== '.git') {
        files.push(...getAllSourceFiles(itemPath));
      }
    } else if (
      item.endsWith('.ts') || 
      item.endsWith('.tsx') || 
      item.endsWith('.js') || 
      item.endsWith('.jsx')
    ) {
      files.push(itemPath);
    }
  }
  
  return files;
}

/**
 * 結果を保存
 */
function saveResults() {
  const result = {
    timestamp: new Date().toISOString(),
    totalFiles: Object.keys(dependencyGraph).length,
    totalDependencies: Object.values(dependencyGraph).flat().length,
    circularDependencies: circularDeps,
    dependencyGraph: dependencyGraph
  };
  
  fs.writeFileSync(DEPS_FILE, JSON.stringify(result, null, 2));
  console.log(`💾 結果を保存: ${DEPS_FILE}\n`);
}

/**
 * サマリーを生成
 */
function generateSummary() {
  let summary = '# 循環依存検出レポート\n\n';
  summary += `実行日時: ${new Date().toISOString()}\n\n`;
  
  summary += '## 📊 サマリー\n\n';
  summary += '| 項目 | 値 |\n';
  summary += '|------|-----|\n';
  summary += `| 解析ファイル数 | ${Object.keys(dependencyGraph).length} |\n`;
  summary += `| 総依存関係数 | ${Object.values(dependencyGraph).flat().length} |\n`;
  summary += `| 循環依存数 | ${circularDeps.length} |\n`;
  
  if (circularDeps.length > 0) {
    summary += '\n## 🔄 循環依存の詳細\n\n';
    
    // 重要度別にグループ化
    const highSeverity = circularDeps.filter(d => d.severity === 'high');
    const mediumSeverity = circularDeps.filter(d => d.severity === 'medium');
    const lowSeverity = circularDeps.filter(d => d.severity === 'low');
    
    if (highSeverity.length > 0) {
      summary += '### 🔴 高重要度 (直接的な相互依存)\n\n';
      for (const dep of highSeverity) {
        summary += `- ${dep.cycle.join(' → ')}\n`;
      }
      summary += '\n';
    }
    
    if (mediumSeverity.length > 0) {
      summary += '### 🟡 中重要度\n\n';
      for (const dep of mediumSeverity) {
        summary += `- ${dep.cycle.join(' → ')}\n`;
      }
      summary += '\n';
    }
    
    if (lowSeverity.length > 0) {
      summary += '### 🟢 低重要度\n\n';
      for (const dep of lowSeverity.slice(0, 10)) {
        summary += `- ${dep.cycle.join(' → ')}\n`;
      }
      if (lowSeverity.length > 10) {
        summary += `\n*他 ${lowSeverity.length - 10} 件*\n`;
      }
      summary += '\n';
    }
    
    summary += '## 💡 解消提案\n\n';
    summary += '1. **インターフェースの抽出**: 共通のインターフェースを別ファイルに分離\n';
    summary += '2. **依存性の逆転**: 依存の方向を見直し、単方向に変更\n';
    summary += '3. **ファサードパターン**: 中間層を導入して依存関係を整理\n';
    summary += '4. **遅延ロード**: 動的importを使用して循環を回避\n';
  } else {
    summary += '\n## ✅ 循環依存は検出されませんでした\n';
  }
  
  fs.writeFileSync(SUMMARY_FILE, summary);
  console.log(`📄 サマリーを生成: ${SUMMARY_FILE}\n`);
}

/**
 * 結果を表示
 */
function displayResults() {
  console.log('🎯 循環依存検出結果:');
  console.log('=====================');
  
  if (circularDeps.length === 0) {
    console.log('✅ 循環依存は検出されませんでした！');
  } else {
    console.log(`❌ ${circularDeps.length}件の循環依存が検出されました\n`);
    
    const highCount = circularDeps.filter(d => d.severity === 'high').length;
    const mediumCount = circularDeps.filter(d => d.severity === 'medium').length;
    const lowCount = circularDeps.filter(d => d.severity === 'low').length;
    
    if (highCount > 0) console.log(`  🔴 高重要度: ${highCount}件`);
    if (mediumCount > 0) console.log(`  🟡 中重要度: ${mediumCount}件`);
    if (lowCount > 0) console.log(`  🟢 低重要度: ${lowCount}件`);
    
    console.log('\n例:');
    const example = circularDeps[0];
    console.log(`  ${example.cycle.slice(0, 3).join(' → ')}...`);
  }
}

// 実行
if (require.main === module) {
  main().catch(error => {
    console.error('循環依存検出エラー:', error);
    process.exit(1);
  });
}