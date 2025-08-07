/**
 * @deprecated Use UnifiedAnalysisEngine instead. This file is kept for backward compatibility.
 * Migration guide: Replace Analyzer with UnifiedAnalysisEngine
 */

import { UnifiedAnalysisEngine, BasicAnalysisResult } from './UnifiedAnalysisEngine';
import { IPlugin } from './types';

/**
 * Legacy AnalysisResult for backward compatibility
 * @deprecated Use BasicAnalysisResult from UnifiedAnalysisEngine instead
 */
export interface AnalysisResult {
  totalFiles: number;
  issues: any[];
  executionTime: number;
}

/**
 * Analyzer class - Legacy wrapper for UnifiedAnalysisEngine
 * @deprecated Use UnifiedAnalysisEngine directly for new code
 */
export class Analyzer {
  private engine: UnifiedAnalysisEngine;
  
  constructor() {
    this.engine = new UnifiedAnalysisEngine();
  }
  
  registerPlugin(plugin: IPlugin): void {
    this.engine.registerPlugin(plugin);
  }
  
  async analyze(targetPath: string): Promise<AnalysisResult> {
    const result = await this.engine.analyze(targetPath);
    
    // Convert BasicAnalysisResult to legacy AnalysisResult format
    return {
      totalFiles: result.totalFiles,
      issues: result.issues,
      executionTime: result.executionTime
    };
  }
  
  private async* findAllFiles(dir: string): AsyncGenerator<string> {
    // Legacy method kept for compatibility
    // Delegates to findTestFiles from fileDiscovery
    const { findTestFiles } = await import('./fileDiscovery');
    for await (const file of findTestFiles(dir)) {
      yield file;
    }
  }
}

// Export legacy TestAnalyzer as alias for Analyzer
export { Analyzer as TestAnalyzer };