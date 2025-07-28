/**
 * Legacy Plugin Adapter
 * v0.8.0 - 既存プラグインをIPluginインターフェースに適合させるアダプター
 */

import { IPlugin, PluginMetadata } from '../interfaces/IPluginManager';
import { IPlugin as ILegacyPlugin, Issue } from '../types';

export class LegacyPluginAdapter implements IPlugin {
  metadata: PluginMetadata;
  
  constructor(
    private legacyPlugin: ILegacyPlugin,
    metadata: Partial<PluginMetadata> = {}
  ) {
    this.metadata = {
      id: metadata.id || legacyPlugin.name,
      name: metadata.name || legacyPlugin.name,
      version: metadata.version || '1.0.0',
      description: metadata.description,
      enabled: metadata.enabled !== false
    };
  }
  
  async analyze(filePath: string): Promise<Issue[]> {
    return this.legacyPlugin.analyze(filePath);
  }
}