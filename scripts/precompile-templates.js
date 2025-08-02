#!/usr/bin/env node

/**
 * Handlebarsテンプレートのプリコンパイル
 * パフォーマンス最適化のためにビルド時にテンプレートをプリコンパイル
 */

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const templatesDir = path.join(__dirname, '../src/reporting/templates');
const outputDir = path.join(__dirname, '../dist/reporting/templates');

// テンプレートディレクトリが存在することを確認
if (!fs.existsSync(templatesDir)) {
  console.error('Templates directory not found:', templatesDir);
  process.exit(1);
}

// 出力ディレクトリを作成
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// テンプレートファイルを検索
const templateFiles = fs.readdirSync(templatesDir)
  .filter(file => file.endsWith('.hbs'));

console.log('Precompiling templates...');

templateFiles.forEach(file => {
  const templatePath = path.join(templatesDir, file);
  const outputPath = path.join(outputDir, file.replace('.hbs', '.js'));
  
  try {
    // テンプレートを読み込み
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    
    // プリコンパイル
    const precompiled = Handlebars.precompile(templateSource);
    
    // 出力
    const output = `
// Precompiled Handlebars template
// Source: ${file}
// Generated: ${new Date().toISOString()}

module.exports = ${precompiled};
`;
    
    fs.writeFileSync(outputPath, output, 'utf-8');
    console.log(`✓ Compiled ${file}`);
  } catch (error) {
    console.error(`✗ Failed to compile ${file}:`, error.message);
  }
});

console.log('Template precompilation complete!');