/**
 * Project context and configuration types
 */

import { BaseMetadata, Position } from './base-types';
// Re-export Position from base-types
export { Position } from './base-types';

// Package.json structure (properly typed, not any)
export interface PackageJsonConfig {
  name: string;
  version: string;
  description?: string;
  main?: string;
  type?: 'module' | 'commonjs';
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  repository?: {
    type: string;
    url: string;
    directory?: string;
  } | string;
  keywords?: string[];
  author?: string | {
    name: string;
    email?: string;
    url?: string;
  };
  contributors?: Array<string | {
    name: string;
    email?: string;
    url?: string;
  }>;
  license?: string;
  bugs?: {
    url?: string;
    email?: string;
  };
  homepage?: string;
  private?: boolean;
  workspaces?: string[] | {
    packages?: string[];
    nohoist?: string[];
  };
  resolutions?: Record<string, string>;
  overrides?: Record<string, string>;
  exports?: Record<string, unknown>;
  files?: string[];
  bin?: string | Record<string, string>;
  man?: string | string[];
  directories?: {
    lib?: string;
    bin?: string;
    man?: string;
    doc?: string;
    example?: string;
    test?: string;
  };
  config?: Record<string, unknown>;
  publishConfig?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional fields
}

// TypeScript configuration (properly typed, not any)
export interface TSConfig {
  compilerOptions?: {
    // Type Checking
    allowUnreachableCode?: boolean;
    allowUnusedLabels?: boolean;
    alwaysStrict?: boolean;
    exactOptionalPropertyTypes?: boolean;
    noFallthroughCasesInSwitch?: boolean;
    noImplicitAny?: boolean;
    noImplicitOverride?: boolean;
    noImplicitReturns?: boolean;
    noImplicitThis?: boolean;
    noPropertyAccessFromIndexSignature?: boolean;
    noUncheckedIndexedAccess?: boolean;
    noUnusedLocals?: boolean;
    noUnusedParameters?: boolean;
    strict?: boolean;
    strictBindCallApply?: boolean;
    strictFunctionTypes?: boolean;
    strictNullChecks?: boolean;
    strictPropertyInitialization?: boolean;
    useUnknownInCatchVariables?: boolean;
    
    // Modules
    allowArbitraryExtensions?: boolean;
    allowImportingTsExtensions?: boolean;
    allowUmdGlobalAccess?: boolean;
    baseUrl?: string;
    customConditions?: string[];
    module?: string;
    moduleResolution?: 'node' | 'classic' | 'node16' | 'nodenext' | 'bundler';
    moduleSuffixes?: string[];
    noResolve?: boolean;
    paths?: Record<string, string[]>;
    resolveJsonModule?: boolean;
    resolvePackageJsonExports?: boolean;
    resolvePackageJsonImports?: boolean;
    rootDir?: string;
    rootDirs?: string[];
    typeRoots?: string[];
    types?: string[];
    
    // Emit
    declaration?: boolean;
    declarationDir?: string;
    declarationMap?: boolean;
    downlevelIteration?: boolean;
    emitBOM?: boolean;
    emitDeclarationOnly?: boolean;
    importHelpers?: boolean;
    importsNotUsedAsValues?: 'remove' | 'preserve' | 'error';
    inlineSourceMap?: boolean;
    inlineSources?: boolean;
    mapRoot?: string;
    newLine?: 'crlf' | 'lf';
    noEmit?: boolean;
    noEmitHelpers?: boolean;
    noEmitOnError?: boolean;
    outDir?: string;
    outFile?: string;
    preserveConstEnums?: boolean;
    preserveValueImports?: boolean;
    removeComments?: boolean;
    sourceMap?: boolean;
    sourceRoot?: string;
    stripInternal?: boolean;
    
    // JavaScript Support
    allowJs?: boolean;
    checkJs?: boolean;
    maxNodeModuleJsDepth?: number;
    
    // Editor Support
    disableSizeLimit?: boolean;
    plugins?: Array<{ name: string; [key: string]: unknown }>;
    
    // Interop Constraints
    allowSyntheticDefaultImports?: boolean;
    esModuleInterop?: boolean;
    forceConsistentCasingInFileNames?: boolean;
    isolatedModules?: boolean;
    preserveSymlinks?: boolean;
    verbatimModuleSyntax?: boolean;
    
    // Language and Environment
    emitDecoratorMetadata?: boolean;
    experimentalDecorators?: boolean;
    jsx?: 'preserve' | 'react' | 'react-jsx' | 'react-jsxdev' | 'react-native';
    jsxFactory?: string;
    jsxFragmentFactory?: string;
    jsxImportSource?: string;
    lib?: string[];
    moduleDetection?: 'auto' | 'legacy' | 'force';
    noLib?: boolean;
    reactNamespace?: string;
    target?: string;
    useDefineForClassFields?: boolean;
    
    // Compiler Diagnostics
    diagnostics?: boolean;
    explainFiles?: boolean;
    extendedDiagnostics?: boolean;
    generateCpuProfile?: string;
    listEmittedFiles?: boolean;
    listFiles?: boolean;
    traceResolution?: boolean;
    
    // Projects
    composite?: boolean;
    disableReferencedProjectLoad?: boolean;
    disableSolutionSearching?: boolean;
    disableSourceOfProjectReferenceRedirect?: boolean;
    incremental?: boolean;
    tsBuildInfoFile?: string;
    
    // Output Formatting
    noErrorTruncation?: boolean;
    preserveWatchOutput?: boolean;
    pretty?: boolean;
    
    // Completeness
    skipDefaultLibCheck?: boolean;
    skipLibCheck?: boolean;
    
    [key: string]: unknown; // Allow additional options
  };
  include?: string[];
  exclude?: string[];
  files?: string[];
  extends?: string;
  references?: Array<{ path: string; prepend?: boolean }>;
  compileOnSave?: boolean;
  typeAcquisition?: {
    enable?: boolean;
    include?: string[];
    exclude?: string[];
    disableFilenameBasedTypeAcquisition?: boolean;
  };
  watchOptions?: Record<string, unknown>;
  [key: string]: unknown; // Allow additional fields
}

// AST Node representation (properly typed, not any)
export interface ASTNode {
  type: string;
  kind?: string | number; // TypeScript AST kind
  startPosition: Position;
  endPosition: Position;
  children?: ASTNode[];
  value?: string | number | boolean | null;
  name?: string;
  text?: string;
  params?: ASTNode[];
  body?: ASTNode | ASTNode[];
  properties?: Record<string, unknown>;
  flags?: number;
  modifiers?: ASTNode[];
  decorators?: ASTNode[];
  typeParameters?: ASTNode[];
  typeArguments?: ASTNode[];
  parent?: ASTNode;
  symbol?: {
    name: string;
    flags: number;
    declarations?: unknown[];
  };
  [key: string]: unknown; // Allow additional AST properties
}


// Project context with properly typed fields (no any)
export interface ProjectContext {
  rootPath?: string;
  projectPath?: string;
  type?: string; // Project type (e.g., 'node', 'web', 'library')
  language?: 'javascript' | 'typescript' | 'python' | 'java' | 'csharp' | 'go' | 'rust' | 'other';
  languages?: string[]; // Multiple languages support
  testFramework?: string;
  framework?: string;
  packageJson?: PackageJsonConfig; // Properly typed, not any
  tsConfig?: TSConfig; // Properly typed, not any
  dependencies?: Record<string, string> | string[]; // Support both formats
  testFiles?: TestFile[]; // Test files in the project
  sourceFiles?: string[]; // Source files in the project
  configuration?: Record<string, unknown>; // Using unknown instead of any
  customConfig?: Record<string, unknown>; // Using unknown instead of any
  filePatterns?: {
    test: string[];
    source: string[];
    ignore: string[];
  };
  metadata?: BaseMetadata;
}

// Test file representation with properly typed fields
export interface TestFile {
  path: string;
  content: string;
  framework?: string;
  testMethods?: TestMethod[]; // Properly typed, not any
  testCount?: number;
  hasTests?: boolean;
  ast?: ASTNode; // Properly typed, not any
  metadata?: {
    framework?: string;
    language: string;
    lastModified: Date;
    size?: number;
    encoding?: string;
  };
}

// Method signature structure for tests
export interface MethodSignature {
  name: string;
  parameters: Array<{
    name: string;
    type?: string;
    source?: 'user-input' | 'database' | 'api' | 'constant';
  }>;
  returnType?: string;
  annotations: string[];
  isAsync: boolean;
  visibility?: 'private' | 'protected' | 'public';
}

// Test method structure
export interface TestMethod {
  name: string;
  type: 'test' | 'suite' | 'hook' | 'helper';
  location: {
    start: Position;
    end: Position;
    startLine?: number;
    startColumn?: number;
    endLine?: number;
    endColumn?: number;
  };
  async?: boolean;
  skip?: boolean;
  only?: boolean;
  timeout?: number;
  tags?: string[];
  assertions?: number | string[];
  description?: string;
  // 追加プロパティ（後方互換性のため）
  content?: string;
  body?: string;
  filePath?: string;
  signature?: string | MethodSignature;
  testType?: 'unit' | 'integration' | 'e2e' | 'security' | 'performance' | 'smoke';
  // Security-related properties
  securityRelevance?: number;
}