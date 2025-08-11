/**
 * ArchitectureDetector
 * Issue #65: アーキテクチャパターン検出専用モジュール
 * 
 * SOLID原則: 単一責任（アーキテクチャ検出のみ）
 * DRY原則: パターン検出ロジックの共通化
 * KISS原則: シンプルなパターンマッチング
 */

import { ArchitecturePattern, ArchitectureType } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * プロジェクトのアーキテクチャパターンを検出
 */
export class ArchitectureDetector {
  private readonly patterns = {
    MVC: {
      directories: ['controllers', 'models', 'views', 'routes'],
      files: ['Controller', 'Model', 'View'],
      confidence: 0.8
    },
    Layered: {
      directories: ['presentation', 'application', 'domain', 'infrastructure', 'persistence'],
      files: ['Service', 'Repository', 'Entity', 'UseCase'],
      confidence: 0.8
    },
    Microservices: {
      directories: ['services', 'api-gateway', 'service-discovery'],
      files: ['Service', 'Gateway', 'Registry'],
      confidence: 0.7
    },
    Hexagonal: {
      directories: ['adapters', 'ports', 'domain', 'application'],
      files: ['Port', 'Adapter', 'UseCase'],
      confidence: 0.75
    },
    CleanArchitecture: {
      directories: ['entities', 'use-cases', 'interface-adapters', 'frameworks'],
      files: ['Entity', 'UseCase', 'Controller', 'Gateway'],
      confidence: 0.75
    }
  };

  /**
   * アーキテクチャパターンを検出
   */
  async detectPattern(projectPath: string): Promise<ArchitecturePattern> {
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    const directories = this.getDirectories(projectPath);
    const files = await this.getProjectFiles(projectPath);
    
    const detectedPatterns: ArchitecturePattern[] = [];

    // 各パターンをチェック
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      const evidence: string[] = [];
      let score = 0;

      // ディレクトリ構造をチェック
      const dirScore = this.checkDirectories(directories, pattern.directories, evidence);
      score += dirScore * 0.6; // ディレクトリ構造は60%の重み

      // ファイル命名パターンをチェック
      const fileScore = this.checkFilePatterns(files, pattern.files, evidence);
      score += fileScore * 0.4; // ファイル命名は40%の重み

      if (score > 0) {
        detectedPatterns.push({
          type: patternName.toLowerCase() as ArchitectureType,
          confidence: score * pattern.confidence,
          evidence,
          suggestions: this.getSuggestions(patternName)
        });
      }
    }

    // 最も確信度の高いパターンを返す
    if (detectedPatterns.length > 0) {
      detectedPatterns.sort((a, b) => b.confidence - a.confidence);
      return detectedPatterns[0];
    }

    // デフォルトはMonolithic
    return {
      type: 'monolithic',
      confidence: 0.5,
      evidence: ['No specific architecture pattern detected'],
      suggestions: this.getSuggestions('Monolithic')
    };
  }

  /**
   * ディレクトリ一覧を取得
   */
  private getDirectories(projectPath: string): string[] {
    const items = fs.readdirSync(projectPath);
    const directories: string[] = [];

    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules') continue;
      
      const itemPath = path.join(projectPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        directories.push(item.toLowerCase());
      }
    }

    return directories;
  }

  /**
   * プロジェクトファイルを取得
   */
  private async getProjectFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];
    const visited = new Set<string>(); // 循環参照を防ぐ
    const maxDepth = 5; // 最大深度を制限
    
    const walkDir = (dir: string, depth: number = 0) => {
      // 深度制限と循環参照チェック
      if (depth > maxDepth || visited.has(dir)) {
        return;
      }
      visited.add(dir);
      
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          if (item.startsWith('.') || item === 'node_modules' || item === 'dist' || item === 'build') continue;
          
          const itemPath = path.join(dir, item);
          
          try {
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
              walkDir(itemPath, depth + 1);
            } else if (stat.isFile()) {
              files.push(path.basename(item));
            }
          } catch (error) {
            // ファイルアクセスエラーは無視
            continue;
          }
        }
      } catch (error) {
        // ディレクトリ読み込みエラーは無視
        return;
      }
    };

    walkDir(projectPath);
    return files;
  }

  /**
   * ディレクトリパターンをチェック
   */
  private checkDirectories(
    directories: string[],
    patternDirs: string[],
    evidence: string[]
  ): number {
    let matches = 0;
    
    for (const patternDir of patternDirs) {
      if (directories.some(dir => dir.includes(patternDir.toLowerCase()))) {
        matches++;
        evidence.push(`${patternDir} directory found`);
      }
    }

    return matches / patternDirs.length;
  }

  /**
   * ファイルパターンをチェック
   */
  private checkFilePatterns(
    files: string[],
    patterns: string[],
    evidence: string[]
  ): number {
    let matches = 0;
    
    for (const pattern of patterns) {
      const matchingFiles = files.filter(file => 
        file.includes(pattern) || file.endsWith(`${pattern}.ts`) || file.endsWith(`${pattern}.js`)
      );
      
      if (matchingFiles.length > 0) {
        matches++;
        evidence.push(`${pattern} files detected`);
      }
    }

    return matches / patterns.length;
  }

  /**
   * アーキテクチャの提案を取得
   */
  private getSuggestions(pattern: string): string[] {
    const suggestions: Record<string, string[]> = {
      MVC: [
        'Maintain clear separation between models, views, and controllers',
        'Avoid business logic in controllers',
        'Keep views simple and focused on presentation'
      ],
      Layered: [
        'Ensure dependencies only go downward',
        'Keep domain logic independent of infrastructure',
        'Use dependency injection for flexibility'
      ],
      Microservices: [
        'Define clear service boundaries',
        'Implement proper service discovery',
        'Use API versioning for backward compatibility'
      ],
      Hexagonal: [
        'Keep domain logic at the center',
        'Use ports for defining contracts',
        'Implement adapters for external integrations'
      ],
      CleanArchitecture: [
        'Follow the dependency rule strictly',
        'Keep frameworks and tools on the outer layers',
        'Make business rules independent of UI and database'
      ],
      Monolithic: [
        'Consider modularizing your codebase',
        'Separate concerns into distinct modules',
        'Extract reusable components'
      ]
    };

    return suggestions[pattern] || [];
  }

  /**
   * ファイル構造から追加の証拠を収集
   */
  async analyzeFileStructure(projectPath: string): Promise<string[]> {
    const evidence: string[] = [];
    const files = await this.getProjectFiles(projectPath);
    
    // Controller files
    if (files.some(f => f.includes('Controller'))) {
      evidence.push('Controller files detected');
    }
    
    // Model files
    if (files.some(f => f.includes('Model'))) {
      evidence.push('Model files detected');
    }
    
    // Service files
    if (files.some(f => f.includes('Service'))) {
      evidence.push('Service files detected');
    }
    
    // Repository pattern
    if (files.some(f => f.includes('Repository'))) {
      evidence.push('Repository pattern detected');
    }
    
    return evidence;
  }
}