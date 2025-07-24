/**
 * ResourceLimits テストスイート  
 * リソース制限監視システムのテスト
 */

import { 
  AnalysisLimits,
  DEFAULT_ANALYSIS_LIMITS,
  RESOURCE_LIMIT_PROFILES,
  ResourceLimitMonitor,
  defaultResourceMonitor
} from '../../src/utils/resourceLimits';

describe('ResourceLimits', () => {
  describe('AnalysisLimits interface and defaults', () => {
    it('should define default analysis limits', () => {
      expect(DEFAULT_ANALYSIS_LIMITS).toBeDefined();
      expect(DEFAULT_ANALYSIS_LIMITS.maxFileSize).toBe(5 * 1024 * 1024);
      expect(DEFAULT_ANALYSIS_LIMITS.maxFilesProcessed).toBe(10000);
      expect(DEFAULT_ANALYSIS_LIMITS.maxAnalysisTime).toBe(300000);
      expect(DEFAULT_ANALYSIS_LIMITS.maxMemoryUsage).toBe(512);
      expect(DEFAULT_ANALYSIS_LIMITS.maxContextLines).toBe(50);
      expect(DEFAULT_ANALYSIS_LIMITS.maxDepth).toBe(10);
      expect(DEFAULT_ANALYSIS_LIMITS.maxPluginResults).toBe(1000);
      expect(DEFAULT_ANALYSIS_LIMITS.maxCacheSize).toBe(100);
    });

    it('should define resource limit profiles', () => {
      expect(RESOURCE_LIMIT_PROFILES.light).toBeDefined();
      expect(RESOURCE_LIMIT_PROFILES.standard).toBeDefined();
      expect(RESOURCE_LIMIT_PROFILES.heavy).toBeDefined();
      
      // light profile should have smaller limits
      expect(RESOURCE_LIMIT_PROFILES.light.maxFileSize).toBeLessThan(DEFAULT_ANALYSIS_LIMITS.maxFileSize);
      expect(RESOURCE_LIMIT_PROFILES.light.maxMemoryUsage).toBeLessThan(DEFAULT_ANALYSIS_LIMITS.maxMemoryUsage);
      
      // heavy profile should have larger limits
      expect(RESOURCE_LIMIT_PROFILES.heavy.maxFileSize).toBeGreaterThan(DEFAULT_ANALYSIS_LIMITS.maxFileSize);
      expect(RESOURCE_LIMIT_PROFILES.heavy.maxMemoryUsage).toBeGreaterThan(DEFAULT_ANALYSIS_LIMITS.maxMemoryUsage);
    });
  });

  describe('ResourceLimitMonitor', () => {
    let monitor: ResourceLimitMonitor;

    beforeEach(() => {
      monitor = new ResourceLimitMonitor();
    });

    describe('constructor', () => {
      it('should initialize with default limits', () => {
        expect(monitor).toBeDefined();
        const usage = monitor.getResourceUsage();
        expect(usage.limits).toEqual(DEFAULT_ANALYSIS_LIMITS);
      });

      it('should initialize with custom limits', () => {
        const customLimits: AnalysisLimits = {
          ...DEFAULT_ANALYSIS_LIMITS,
          maxFileSize: 1024
        };
        const customMonitor = new ResourceLimitMonitor(customLimits);
        const usage = customMonitor.getResourceUsage();
        expect(usage.limits.maxFileSize).toBe(1024);
      });
    });

    describe('startAnalysis', () => {
      it('should initialize analysis tracking', () => {
        monitor.startAnalysis();
        
        const usage = monitor.getResourceUsage();
        expect(usage.elapsedTime).toBeGreaterThanOrEqual(0);
        expect(usage.processedFiles).toBe(0);
      });
    });

    describe('checkFileSize', () => {
      beforeEach(() => {
        monitor.startAnalysis();
      });

      it('should return true for files within size limit', () => {
        const result = monitor.checkFileSize(1024);
        expect(result).toBe(true);
      });

      it('should return false for files exceeding size limit', () => {
        const largeSize = DEFAULT_ANALYSIS_LIMITS.maxFileSize + 1;
        const result = monitor.checkFileSize(largeSize);
        expect(result).toBe(false);
      });

      it('should handle file path parameter', () => {
        const result = monitor.checkFileSize(1024, '/test/file.ts');
        expect(result).toBe(true);
      });
    });

    describe('checkAnalysisTime', () => {
      beforeEach(() => {
        monitor.startAnalysis();
      });

      it('should return true for analysis within time limit', () => {
        const result = monitor.checkAnalysisTime();
        expect(result).toBe(true);
      });

      it('should return false when analysis time exceeds limit', (done) => {
        // 時間制限を1msに設定してテスト
        monitor.updateLimits({ maxAnalysisTime: 1 });
        
        // 少し待機してから時間チェック
        setTimeout(() => {
          const result = monitor.checkAnalysisTime();
          expect(result).toBe(false);
          done();
        }, 10);
      });
    });

    describe('checkMemoryUsage', () => {
      beforeEach(() => {
        monitor.startAnalysis();
      });

      it('should return true for normal memory usage', () => {
        const result = monitor.checkMemoryUsage();
        expect(result).toBe(true);
      });

      it('should check memory usage correctly', () => {
        // メモリチェック機能が動作することを確認
        const result = monitor.checkMemoryUsage();
        expect(typeof result).toBe('boolean');
      });
    });

    describe('checkProcessedFiles', () => {
      beforeEach(() => {
        monitor.startAnalysis();
      });

      it('should return true when files processed is under limit', () => {
        const result = monitor.checkProcessedFiles();
        expect(result).toBe(true);
      });

      it('should return false when reaching file limit', () => {
        monitor.updateLimits({ maxFilesProcessed: 0 });
        const result = monitor.checkProcessedFiles();
        expect(result).toBe(false);
      });

      it('should track processed files correctly', () => {
        monitor.recordProcessedFile();
        monitor.recordProcessedFile();
        
        const usage = monitor.getResourceUsage();
        expect(usage.processedFiles).toBe(2);
      });
    });

    describe('checkContextLines', () => {
      it('should return original value when within limit', () => {
        const result = monitor.checkContextLines(30);
        expect(result).toBe(30);
      });

      it('should return limited value when exceeding limit', () => {
        const result = monitor.checkContextLines(100);
        expect(result).toBe(DEFAULT_ANALYSIS_LIMITS.maxContextLines);
      });

      it('should handle zero and negative values', () => {
        expect(monitor.checkContextLines(0)).toBe(0);
        expect(monitor.checkContextLines(-5)).toBe(-5);
      });
    });

    describe('checkDepth', () => {
      it('should return true for depth within limit', () => {
        const result = monitor.checkDepth(5, '/test/path');
        expect(result).toBe(true);
      });

      it('should return false for depth exceeding limit', () => {
        const result = monitor.checkDepth(DEFAULT_ANALYSIS_LIMITS.maxDepth + 1, '/test/path');
        expect(result).toBe(false);
      });

      it('should handle edge cases', () => {
        expect(monitor.checkDepth(0, '/test')).toBe(true);
        expect(monitor.checkDepth(DEFAULT_ANALYSIS_LIMITS.maxDepth, '/test')).toBe(true);
      });
    });

    describe('checkPluginResults', () => {
      it('should return true for results within limit', () => {
        const result = monitor.checkPluginResults(100);
        expect(result).toBe(true);
      });

      it('should return false for results exceeding limit', () => {
        const result = monitor.checkPluginResults(DEFAULT_ANALYSIS_LIMITS.maxPluginResults + 1);
        expect(result).toBe(false);
      });

      it('should handle plugin ID parameter', () => {
        const result = monitor.checkPluginResults(100, 'test-plugin');
        expect(result).toBe(true);
      });
    });

    describe('recordProcessedFile', () => {
      beforeEach(() => {
        monitor.startAnalysis();
      });

      it('should increment processed file count', () => {
        const initialUsage = monitor.getResourceUsage();
        monitor.recordProcessedFile();
        const updatedUsage = monitor.getResourceUsage();
        
        expect(updatedUsage.processedFiles).toBe(initialUsage.processedFiles + 1);
      });
    });

    describe('getResourceUsage', () => {
      beforeEach(() => {
        monitor.startAnalysis();
      });

      it('should return current resource usage', () => {
        const usage = monitor.getResourceUsage();
        
        expect(usage).toHaveProperty('elapsedTime');
        expect(usage).toHaveProperty('processedFiles');
        expect(usage).toHaveProperty('memoryUsage');
        expect(usage).toHaveProperty('limits');
        
        expect(typeof usage.elapsedTime).toBe('number');
        expect(typeof usage.processedFiles).toBe('number');
        expect(typeof usage.memoryUsage).toBe('number');
        expect(usage.limits).toEqual(DEFAULT_ANALYSIS_LIMITS);
      });
    });

    describe('updateLimits', () => {
      it('should update specific limits', () => {
        const newLimits = { maxFileSize: 2048, maxMemoryUsage: 256 };
        monitor.updateLimits(newLimits);
        
        const usage = monitor.getResourceUsage();
        expect(usage.limits.maxFileSize).toBe(2048);
        expect(usage.limits.maxMemoryUsage).toBe(256);
        expect(usage.limits.maxFilesProcessed).toBe(DEFAULT_ANALYSIS_LIMITS.maxFilesProcessed);
      });

      it('should preserve existing limits when updating', () => {
        const originalMaxFiles = DEFAULT_ANALYSIS_LIMITS.maxFilesProcessed;
        monitor.updateLimits({ maxFileSize: 1024 });
        
        const usage = monitor.getResourceUsage();
        expect(usage.limits.maxFilesProcessed).toBe(originalMaxFiles);
      });
    });

    describe('setProfile', () => {
      it('should set light profile limits', () => {
        monitor.setProfile('light');
        const usage = monitor.getResourceUsage();
        
        expect(usage.limits).toEqual(RESOURCE_LIMIT_PROFILES.light);
      });

      it('should set standard profile limits', () => {
        monitor.setProfile('standard');
        const usage = monitor.getResourceUsage();
        
        expect(usage.limits).toEqual(RESOURCE_LIMIT_PROFILES.standard);
      });

      it('should set heavy profile limits', () => {
        monitor.setProfile('heavy');
        const usage = monitor.getResourceUsage();
        
        expect(usage.limits).toEqual(RESOURCE_LIMIT_PROFILES.heavy);
      });
    });
  });

  describe('defaultResourceMonitor singleton', () => {
    it('should export a default monitor instance', () => {
      expect(defaultResourceMonitor).toBeDefined();
      expect(defaultResourceMonitor).toBeInstanceOf(ResourceLimitMonitor);
    });

    it('should be initialized with default limits', () => {
      const usage = defaultResourceMonitor.getResourceUsage();
      expect(usage.limits).toEqual(DEFAULT_ANALYSIS_LIMITS);
    });
  });

  describe('module exports', () => {
    it('should export all required interfaces and classes', () => {
      expect(DEFAULT_ANALYSIS_LIMITS).toBeDefined();
      expect(RESOURCE_LIMIT_PROFILES).toBeDefined();
      expect(ResourceLimitMonitor).toBeDefined();
      expect(defaultResourceMonitor).toBeDefined();
    });
  });
});