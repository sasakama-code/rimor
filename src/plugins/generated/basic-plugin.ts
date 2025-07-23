import * as fs from 'fs';
import { IPlugin, Issue } from '../core/types';

/**
 * 基本プラグインテンプレート
 * 
 * 作成日: 2025-07-23T12:01:56.229Z
 * 作成方法: template
 */
export class BasicPlugin implements IPlugin {
  name = 'basic-plugin';

  async analyze(filePath: string): Promise<Issue[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const issues: Issue[] = [];

    // ここにチェックロジックを実装してください
    // 例: 特定のパターンの存在チェック
    
    return issues;
  }
}