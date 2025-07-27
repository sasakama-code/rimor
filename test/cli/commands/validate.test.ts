import { ValidateCommand } from '../../../src/cli/commands/validate';
import { Analyzer } from '../../../src/core/analyzer';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('../../../src/core/analyzer');
jest.mock('../../../src/cli/output');

describe('ValidateCommand', () => {
  let validateCommand: ValidateCommand;
  let mockAnalyzer: jest.Mocked<Analyzer>;
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    validateCommand = new ValidateCommand();
    mockAnalyzer = new Analyzer() as jest.Mocked<Analyzer>;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute', () => {
    it('should validate configuration successfully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({
          plugins: ['testExistence'],
          output: { format: 'json' }
        })
      );
      
      await validateCommand.execute('.');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('valid')
      );
    });

    it('should report invalid configuration', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');
      
      await validateCommand.execute('.');
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid')
      );
    });

    it('should handle missing configuration file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      await validateCommand.execute('.');
      
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('not found')
      );
    });
  });

  describe('validatePlugins', () => {
    it('should validate plugin configuration', async () => {
      const config = {
        plugins: ['testExistence', 'assertionExists']
      };
      
      const result = await validateCommand.validatePlugins(config);
      
      expect(result.valid).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('should detect invalid plugin names', async () => {
      const config = {
        plugins: ['invalid-plugin-name']
      };
      
      const result = await validateCommand.validatePlugins(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateOutput', () => {
    it('should validate output configuration', () => {
      const config = {
        output: {
          format: 'json',
          file: './output.json'
        }
      };
      
      const result = validateCommand.validateOutput(config);
      
      expect(result.valid).toBe(true);
    });

    it('should detect invalid output format', () => {
      const config = {
        output: {
          format: 'invalid-format'
        }
      };
      
      const result = validateCommand.validateOutput(config);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('format')
      );
    });
  });

  describe('validatePaths', () => {
    it('should validate include/exclude paths', () => {
      const config = {
        include: ['src/**/*.ts'],
        exclude: ['node_modules/**']
      };
      
      const result = validateCommand.validatePaths(config);
      
      expect(result.valid).toBe(true);
    });

    it('should detect invalid path patterns', () => {
      const config = {
        include: ['../../../outside-project/**']
      };
      
      const result = validateCommand.validatePaths(config);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('checkDependencies', () => {
    it('should check for required dependencies', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        JSON.stringify({
          dependencies: {
            'typescript': '^4.0.0'
          },
          devDependencies: {
            'jest': '^27.0.0'
          }
        })
      );
      
      const result = await validateCommand.checkDependencies();
      
      expect(result.hasTypeScript).toBe(true);
      expect(result.hasJest).toBe(true);
    });
  });

  describe('suggestFixes', () => {
    it('should suggest fixes for common issues', () => {
      const errors = [
        'Plugin "unknownPlugin" not found',
        'Invalid output format "xml"'
      ];
      
      const suggestions = validateCommand.suggestFixes(errors);
      
      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });
});
