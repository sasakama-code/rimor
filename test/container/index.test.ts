import 'reflect-metadata';
import { Container } from 'inversify';
import { setupContainer } from '../../src/container';
import { 
  TYPES, 
  IAnalysisEngine, 
  IPluginManager, 
  IReporter, 
  ISecurityAuditor 
} from '../../src/container/types';

describe('DIコンテナ設定', () => {
  let container: Container;

  beforeEach(() => {
    container = setupContainer();
  });

  afterEach(() => {
    container.unbindAll();
  });

  it('IAnalysisEngineがバインドされていること', () => {
    const engine = container.get<IAnalysisEngine>(TYPES.IAnalysisEngine);
    expect(engine).toBeDefined();
    expect(engine.analyze).toBeDefined();
    expect(engine.analyzeWithPlugins).toBeDefined();
  });

  it('IPluginManagerがバインドされていること', () => {
    const manager = container.get<IPluginManager>(TYPES.IPluginManager);
    expect(manager).toBeDefined();
    expect(manager.loadPlugin).toBeDefined();
    expect(manager.getPlugins).toBeDefined();
  });

  it('IReporterがバインドされていること', () => {
    const reporter = container.get<IReporter>(TYPES.IReporter);
    expect(reporter).toBeDefined();
    expect(reporter.generateReport).toBeDefined();
    expect(reporter.formatOutput).toBeDefined();
  });

  it('ISecurityAuditorがバインドされていること', () => {
    const auditor = container.get<ISecurityAuditor>(TYPES.ISecurityAuditor);
    expect(auditor).toBeDefined();
    expect(auditor.auditCode).toBeDefined();
    expect(auditor.validateSecurity).toBeDefined();
  });

  it('シングルトンスコープが正しく設定されていること', () => {
    const engine1 = container.get<IAnalysisEngine>(TYPES.IAnalysisEngine);
    const engine2 = container.get<IAnalysisEngine>(TYPES.IAnalysisEngine);
    expect(engine1).toBe(engine2);

    const manager1 = container.get<IPluginManager>(TYPES.IPluginManager);
    const manager2 = container.get<IPluginManager>(TYPES.IPluginManager);
    expect(manager1).toBe(manager2);
  });

  it('異なるインターフェースが異なるインスタンスを返すこと', () => {
    const engine = container.get<IAnalysisEngine>(TYPES.IAnalysisEngine);
    const manager = container.get<IPluginManager>(TYPES.IPluginManager);
    expect(engine).not.toBe(manager);
  });
});