/**
 * Analysis Engine Implementation
 * v0.8.0 - 既存のAnalyzerクラスをDI対応にラップ
 */

import { injectable, inject } from 'inversify';
import { IAnalysisEngine, AnalysisResult, AnalysisOptions } from '../interfaces/IAnalysisEngine';
import { UnifiedAnalysisEngine } from '../engine';
import { TYPES } from '../../container/types';
import { IPluginManager } from '../interfaces/IPluginManager';

/**
 * Analysis Engine Implementation
 * v0.8.0 - UnifiedAnalysisEngineへのブリッジ実装
 */
@injectable()
export class AnalysisEngineImpl implements IAnalysisEngine {
  private engine: UnifiedAnalysisEngine;
  
  constructor(
    @inject(TYPES.PluginManager) pluginManager: IPluginManager
  ) {
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