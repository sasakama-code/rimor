/**
 * PatternDetector 統合テスト
 * モックを使用せず、実際のファイルシステムで動作を検証
 */

import { PatternDetector } from '../../../src/analyzers/structure-analysis/PatternDetector';
import * as fs from 'fs';
import * as path from 'path';
import {
  createTempProject,
  createTestFile,
  createGodObjectCode,
  createSpaghettiCode,
  cleanupTempProject
} from '../../helpers/integration-test-utils';

describe('PatternDetector Integration Tests', () => {
  let detector: PatternDetector;
  let projectDir: string;

  beforeEach(() => {
    detector = new PatternDetector();
    projectDir = createTempProject('pattern-detector-test-');
  });

  afterEach(() => {
    cleanupTempProject(projectDir);
  });

  describe('detectDesignPatterns', () => {
    it('should detect Singleton pattern in actual files', () => {
      const singletonCode = `
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  
  private constructor() {
    // Private constructor prevents direct instantiation
  }
  
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
  
  public query(sql: string) {
    // Database query implementation
    return [];
  }
}
`;

      const filePath = path.join(projectDir, 'DatabaseConnection.ts');
      createTestFile(projectDir, 'DatabaseConnection.ts', singletonCode);
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const patterns = detector.detectDesignPatterns(fileContent, 'DatabaseConnection.ts');
      
      expect(patterns).toContainEqual(
        expect.objectContaining({
          name: 'Singleton',
          type: 'Creational',
          location: 'DatabaseConnection.ts'
        })
      );
    });

    it('should detect Factory pattern in actual files', () => {
      const factoryCode = `
export interface Animal {
  speak(): string;
}

class Dog implements Animal {
  speak(): string {
    return 'Woof!';
  }
}

class Cat implements Animal {
  speak(): string {
    return 'Meow!';
  }
}

export class AnimalFactory {
  createAnimal(type: string): Animal {
    switch(type) {
      case 'dog':
        return new Dog();
      case 'cat':
        return new Cat();
      default:
        throw new Error('Unknown animal type');
    }
  }
}
`;

      const filePath = path.join(projectDir, 'AnimalFactory.ts');
      createTestFile(projectDir, 'AnimalFactory.ts', factoryCode);
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const patterns = detector.detectDesignPatterns(fileContent, 'AnimalFactory.ts');
      
      expect(patterns).toContainEqual(
        expect.objectContaining({
          name: 'Factory',
          type: 'Creational',
          location: 'AnimalFactory.ts'
        })
      );
    });

    it('should detect Observer pattern in actual files', () => {
      const observerCode = `
export class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();
  
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }
  
  removeAllListeners(event?: string) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
`;

      const filePath = path.join(projectDir, 'EventEmitter.ts');
      createTestFile(projectDir, 'EventEmitter.ts', observerCode);
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const patterns = detector.detectDesignPatterns(fileContent, 'EventEmitter.ts');
      
      expect(patterns).toContainEqual(
        expect.objectContaining({
          name: 'Observer',
          type: 'Behavioral',
          location: 'EventEmitter.ts'
        })
      );
    });
  });

  describe('detectAntiPatterns', () => {
    it('should detect God Object anti-pattern in actual files', () => {
      const godObjectCode = createGodObjectCode();
      const filePath = path.join(projectDir, 'ApplicationManager.ts');
      createTestFile(projectDir, 'ApplicationManager.ts', godObjectCode);
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const antiPatterns = detector.detectAntiPatterns(fileContent, 'ApplicationManager.ts');
      
      expect(antiPatterns).toContainEqual(
        expect.objectContaining({
          type: 'God Object',
          severity: 'high',
          location: 'ApplicationManager.ts',
          recommendation: expect.stringContaining('Single Responsibility')
        })
      );
    });

    it('should detect Spaghetti Code anti-pattern in actual files', () => {
      const spaghettiCode = createSpaghettiCode();
      const filePath = path.join(projectDir, 'processData.ts');
      createTestFile(projectDir, 'processData.ts', spaghettiCode);
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const antiPatterns = detector.detectAntiPatterns(fileContent, 'processData.ts');
      
      expect(antiPatterns).toContainEqual(
        expect.objectContaining({
          type: 'Spaghetti Code',
          severity: 'medium',
          location: 'processData.ts',
          recommendation: expect.stringContaining('nested')
        })
      );
    });

    it('should detect Copy-Paste Programming in actual files', () => {
      const copyPasteCode = `
function calculateTax1(amount: number): number {
  const rate = 0.1;
  const deduction = 100;
  const taxableAmount = amount - deduction;
  return taxableAmount * rate;
}

function calculateTax2(amount: number): number {
  const rate = 0.1;
  const deduction = 100;
  const taxableAmount = amount - deduction;
  return taxableAmount * rate;
}

function calculateTax3(amount: number): number {
  const rate = 0.1;
  const deduction = 100;
  const taxableAmount = amount - deduction;
  return taxableAmount * rate;
}
`;

      const filePath = path.join(projectDir, 'taxCalculator.ts');
      createTestFile(projectDir, 'taxCalculator.ts', copyPasteCode);
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const antiPatterns = detector.detectAntiPatterns(fileContent, 'taxCalculator.ts');
      
      expect(antiPatterns).toContainEqual(
        expect.objectContaining({
          type: 'Copy-Paste Programming',
          severity: 'medium',
          location: 'taxCalculator.ts',
          recommendation: expect.stringContaining('DRY')
        })
      );
    });

    it('should detect Long Method anti-pattern in actual files', () => {
      const longMethodCode = `
export class DataProcessor {
  processData(data: any[]): any[] {
    // Line 1
    const result = [];
    // Line 2
    let temp = null;
    // Line 3
    let counter = 0;
    // Line 4
    let accumulator = 0;
    // Line 5
    const cache = new Map();
    ${Array(50).fill('// Processing line').join('\n    ')}
    // More than 50 lines of processing
    for (let i = 0; i < data.length; i++) {
      // Complex processing
      temp = data[i];
      counter++;
      accumulator += temp.value;
      cache.set(temp.id, temp);
      result.push(temp);
    }
    return result;
  }
}
`;

      const filePath = path.join(projectDir, 'DataProcessor.ts');
      createTestFile(projectDir, 'DataProcessor.ts', longMethodCode);
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const antiPatterns = detector.detectAntiPatterns(fileContent, 'DataProcessor.ts');
      
      expect(antiPatterns).toContainEqual(
        expect.objectContaining({
          type: 'Long Method',
          severity: 'medium',
          location: 'DataProcessor.ts'
        })
      );
    });
  });

  describe('Integration with multiple files', () => {
    it('should analyze patterns across multiple files in a project', () => {
      // 複数のファイルを作成
      createTestFile(projectDir, 'src/singleton.ts', `
export class Config {
  private static instance: Config;
  private constructor() {}
  static getInstance() { 
    if (!this.instance) this.instance = new Config();
    return this.instance;
  }
}
      `);

      createTestFile(projectDir, 'src/factory.ts', `
export class ShapeFactory {
  createShape(type: string) {
    switch(type) {
      case 'circle': return new Circle();
      case 'square': return new Square();
      default: throw new Error('Unknown shape');
    }
  }
}
      `);

      createTestFile(projectDir, 'src/god-object.ts', createGodObjectCode());

      // 各ファイルを読み込んで分析
      const singletonContent = fs.readFileSync(path.join(projectDir, 'src/singleton.ts'), 'utf-8');
      const factoryContent = fs.readFileSync(path.join(projectDir, 'src/factory.ts'), 'utf-8');
      const godObjectContent = fs.readFileSync(path.join(projectDir, 'src/god-object.ts'), 'utf-8');

      const singletonPatterns = detector.detectDesignPatterns(singletonContent, 'singleton.ts');
      const factoryPatterns = detector.detectDesignPatterns(factoryContent, 'factory.ts');
      const godObjectAntiPatterns = detector.detectAntiPatterns(godObjectContent, 'god-object.ts');

      expect(singletonPatterns).toContainEqual(
        expect.objectContaining({ name: 'Singleton' })
      );
      expect(factoryPatterns).toContainEqual(
        expect.objectContaining({ name: 'Factory' })
      );
      expect(godObjectAntiPatterns).toContainEqual(
        expect.objectContaining({ type: 'God Object' })
      );
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty files gracefully', () => {
      const emptyFile = path.join(projectDir, 'empty.ts');
      createTestFile(projectDir, 'empty.ts', '');
      
      const fileContent = fs.readFileSync(emptyFile, 'utf-8');
      const patterns = detector.detectDesignPatterns(fileContent, 'empty.ts');
      const antiPatterns = detector.detectAntiPatterns(fileContent, 'empty.ts');
      
      expect(patterns).toEqual([]);
      expect(antiPatterns).toEqual([]);
    });

    it('should handle files with only comments', () => {
      const commentOnlyCode = `
// This is a comment
/* This is a multi-line
   comment */
// Another comment
      `;
      
      const filePath = path.join(projectDir, 'comments.ts');
      createTestFile(projectDir, 'comments.ts', commentOnlyCode);
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const patterns = detector.detectDesignPatterns(fileContent, 'comments.ts');
      const antiPatterns = detector.detectAntiPatterns(fileContent, 'comments.ts');
      
      expect(patterns).toEqual([]);
      expect(antiPatterns).toEqual([]);
    });

    it('should handle very large files', () => {
      // 大きなファイルを生成
      const largeCode = Array(1000).fill('function test() { return true; }').join('\n');
      
      const filePath = path.join(projectDir, 'large.ts');
      createTestFile(projectDir, 'large.ts', largeCode);
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      // エラーなく処理できることを確認
      expect(() => {
        detector.detectDesignPatterns(fileContent, 'large.ts');
        detector.detectAntiPatterns(fileContent, 'large.ts');
      }).not.toThrow();
    });
  });
});