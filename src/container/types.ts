/**
 * Dependency Injection トークン定義
 * v0.8.0 - 簡素化されたDIコンテナ用の型定義
 */

const TYPES = {
  // Core Services
  AnalysisEngine: Symbol.for('AnalysisEngine'),
  UnifiedAnalysisEngine: Symbol.for('UnifiedAnalysisEngine'),
  SecurityAuditor: Symbol.for('SecurityAuditor'),
  Reporter: Symbol.for('Reporter'),
  PluginManager: Symbol.for('PluginManager'),
  UnifiedPluginManager: Symbol.for('UnifiedPluginManager'),
  
  // Infrastructure
  ConfigService: Symbol.for('ConfigService'),
  FileSystem: Symbol.for('FileSystem'),
  Logger: Symbol.for('Logger'),
  
  // Plugins
  Plugin: Symbol.for('Plugin'),
  
  // Utils
  PathResolver: Symbol.for('PathResolver'),
  CacheManager: Symbol.for('CacheManager')
};

export { TYPES };