/**
 * Analysis Engine Wrapper
 * inversifyデコレータを使用せず、シンプルなDIコンテナ向けのラッパー
 * Phase 6: 既存コンポーネントとの共存
 */

import { IAnalysisEngine, AnalysisResult, AnalysisOptions } from '../interfaces/IAnalysisEngine';
import { IPluginManager } from '../interfaces/IPluginManager';
import { UnifiedAnalysisEngine } from '../engine';

/**
 * Analysis Engine Wrapper
 * 既存のAnalysisEngineをinversifyなしで動作させる
 */
export class AnalysisEngineWrapper implements IAnalysisEngine {
  private engine: UnifiedAnalysisEngine;
  
  constructor(pluginManager: IPluginManager) {
    this.engine = new UnifiedAnalysisEngine(pluginManager);
  }
  
  async analyze(targetPath: string, options?: AnalysisOptions): Promise<AnalysisResult> {
    return this.engine.analyze(targetPath, options);
  }
  
  async generateAST(filePath: string): Promise<any> {
    return this.engine.generateAST(filePath);
  }
  
  async clearCache(): Promise<void> {
    return this.engine.clearCache();
  }
}