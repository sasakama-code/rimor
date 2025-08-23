import 'reflect-metadata';
import { Container, initializeContainer, TYPES } from '../../src/container';
import type { IAnalysisEngine } from '../../src/core/interfaces/IAnalysisEngine';
import type { IPluginManager } from '../../src/core/interfaces/IPluginManager';
import type { IReporter } from '../../src/core/interfaces/IReporter';
import type { ISecurityAuditor } from '../../src/core/interfaces/ISecurityAuditor';

describe('DIコンテナ設定', () => {
  let container: Container;

  beforeEach(() => {
    container = initializeContainer();
  });

  afterEach(() => {
    container.dispose();
  });

  it('IAnalysisEngineがバインドされていること', () => {
    const engine = container.get<IAnalysisEngine>(TYPES.AnalysisEngine);
    expect(engine).toBeDefined();
    expect(engine.analyze).toBeDefined();
  });

  it('IPluginManagerがバインドされていること', () => {
    const manager = container.get<IPluginManager>(TYPES.PluginManager);
    expect(manager).toBeDefined();
    expect(manager.register).toBeDefined();
    expect(manager.getPlugins).toBeDefined();
    expect(manager.getPlugin).toBeDefined();
    expect(manager.runAll).toBeDefined();
  });

  it('IReporterがバインドされていること', () => {
    const reporter = container.get<IReporter>(TYPES.Reporter);
    expect(reporter).toBeDefined();
    expect(reporter.generateAnalysisReport).toBeDefined();
    expect(reporter.generateSecurityReport).toBeDefined();
    expect(reporter.printToConsole).toBeDefined();
    // generateCombinedReportはオプショナル
    if (reporter.generateCombinedReport) {
      expect(reporter.generateCombinedReport).toBeDefined();
    }
  });

  it('ISecurityAuditorがバインドされていること', () => {
    const auditor = container.get<ISecurityAuditor>(TYPES.SecurityAuditor);
    expect(auditor).toBeDefined();
    expect(auditor.audit).toBeDefined();
    expect(auditor.scanFile).toBeDefined();
  });

  it('シングルトンスコープが正しく設定されていること', () => {
    const engine1 = container.get<IAnalysisEngine>(TYPES.AnalysisEngine);
    const engine2 = container.get<IAnalysisEngine>(TYPES.AnalysisEngine);
    expect(engine1).toBe(engine2);

    const manager1 = container.get<IPluginManager>(TYPES.PluginManager);
    const manager2 = container.get<IPluginManager>(TYPES.PluginManager);
    expect(manager1).toBe(manager2);
  });

  it('異なるインターフェースが異なるインスタンスを返すこと', () => {
    const engine = container.get<IAnalysisEngine>(TYPES.AnalysisEngine);
    const manager = container.get<IPluginManager>(TYPES.PluginManager);
    expect(engine).not.toBe(manager);
  });
});