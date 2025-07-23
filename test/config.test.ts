import { ConfigLoader, RimorConfig } from '@/core/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ConfigLoader', () => {
  let tempDir: string;
  let loader: ConfigLoader;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-test-'));
    loader = new ConfigLoader();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('loadConfig', () => {
    it('should return default config when no config file exists', async () => {
      const config = await loader.loadConfig(tempDir);
      
      expect(config).toEqual({
        excludePatterns: [
          'node_modules/**',
          'dist/**',
          'build/**',
          '.git/**'
        ],
        plugins: {
          'test-existence': {
            enabled: true,
            excludeFiles: ['index.ts', 'index.js', 'types.ts', 'types.js', 'config.ts', 'config.js']
          },
          'assertion-exists': {
            enabled: true
          }
        },
        output: {
          format: 'text',
          verbose: false
        }
      });
    });

    it('should load .rimorrc.json config file', async () => {
      const configContent = {
        excludePatterns: ['custom/**'],
        plugins: {
          'test-existence': { enabled: false },
          'assertion-exists': { enabled: true }
        },
        output: { format: 'json', verbose: true }
      };

      fs.writeFileSync(path.join(tempDir, '.rimorrc.json'), JSON.stringify(configContent));
      
      const config = await loader.loadConfig(tempDir);
      
      expect(config.excludePatterns).toEqual(['custom/**']);
      expect(config.plugins['test-existence'].enabled).toBe(false);
      expect(config.plugins['assertion-exists'].enabled).toBe(true);
      expect(config.output.format).toBe('json');
      expect(config.output.verbose).toBe(true);
    });

    it('should merge partial config with defaults', async () => {
      const configContent = {
        plugins: {
          'test-existence': { enabled: false }
        }
      };

      fs.writeFileSync(path.join(tempDir, '.rimorrc.json'), JSON.stringify(configContent));
      
      const config = await loader.loadConfig(tempDir);
      
      // Defaults should be preserved
      expect(config.excludePatterns).toEqual([
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**'
      ]);
      
      // Only specified values should be overridden
      expect(config.plugins['test-existence'].enabled).toBe(false);
      expect(config.plugins['assertion-exists'].enabled).toBe(true);
      expect(config.output.format).toBe('text');
    });

    it('should find config file in parent directories', async () => {
      const subDir = path.join(tempDir, 'nested', 'deep');
      fs.mkdirSync(subDir, { recursive: true });
      
      const configContent = {
        output: { format: 'json' }
      };
      
      fs.writeFileSync(path.join(tempDir, '.rimorrc.json'), JSON.stringify(configContent));
      
      const config = await loader.loadConfig(subDir);
      
      expect(config.output.format).toBe('json');
    });

    it('should handle invalid JSON gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      fs.writeFileSync(path.join(tempDir, '.rimorrc.json'), '{invalid json}');
      
      const config = await loader.loadConfig(tempDir);
      
      // Should fallback to default config
      expect(config.output.format).toBe('text');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('設定ファイルの読み込みに失敗しました')
      );
      
      consoleSpy.mockRestore();
    });

    it('should support different config filenames', async () => {
      const configContent = { output: { format: 'json' } };
      
      // Test .rimorrc
      fs.writeFileSync(path.join(tempDir, '.rimorrc'), JSON.stringify(configContent));
      let config = await loader.loadConfig(tempDir);
      expect(config.output.format).toBe('json');
      
      fs.unlinkSync(path.join(tempDir, '.rimorrc'));
      
      // Test rimor.config.json
      fs.writeFileSync(path.join(tempDir, 'rimor.config.json'), JSON.stringify(configContent));
      config = await loader.loadConfig(tempDir);
      expect(config.output.format).toBe('json');
    });
  });

  describe('config priority', () => {
    it('should prioritize .rimorrc.json over other config files', async () => {
      fs.writeFileSync(path.join(tempDir, '.rimorrc.json'), JSON.stringify({
        output: { format: 'json' }
      }));
      fs.writeFileSync(path.join(tempDir, '.rimorrc'), JSON.stringify({
        output: { format: 'text' }
      }));
      
      const config = await loader.loadConfig(tempDir);
      expect(config.output.format).toBe('json');
    });
  });
});