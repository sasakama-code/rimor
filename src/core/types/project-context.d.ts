/**
 * Project context and configuration types
 */
import { BaseMetadata, Position } from './base-types';
export { Position } from './base-types';
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
    [key: string]: unknown;
}
export interface TSConfig {
    compilerOptions?: {
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
        allowJs?: boolean;
        checkJs?: boolean;
        maxNodeModuleJsDepth?: number;
        disableSizeLimit?: boolean;
        plugins?: Array<{
            name: string;
            [key: string]: unknown;
        }>;
        allowSyntheticDefaultImports?: boolean;
        esModuleInterop?: boolean;
        forceConsistentCasingInFileNames?: boolean;
        isolatedModules?: boolean;
        preserveSymlinks?: boolean;
        verbatimModuleSyntax?: boolean;
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
        diagnostics?: boolean;
        explainFiles?: boolean;
        extendedDiagnostics?: boolean;
        generateCpuProfile?: string;
        listEmittedFiles?: boolean;
        listFiles?: boolean;
        traceResolution?: boolean;
        composite?: boolean;
        disableReferencedProjectLoad?: boolean;
        disableSolutionSearching?: boolean;
        disableSourceOfProjectReferenceRedirect?: boolean;
        incremental?: boolean;
        tsBuildInfoFile?: string;
        noErrorTruncation?: boolean;
        preserveWatchOutput?: boolean;
        pretty?: boolean;
        skipDefaultLibCheck?: boolean;
        skipLibCheck?: boolean;
        [key: string]: unknown;
    };
    include?: string[];
    exclude?: string[];
    files?: string[];
    extends?: string;
    references?: Array<{
        path: string;
        prepend?: boolean;
    }>;
    compileOnSave?: boolean;
    typeAcquisition?: {
        enable?: boolean;
        include?: string[];
        exclude?: string[];
        disableFilenameBasedTypeAcquisition?: boolean;
    };
    watchOptions?: Record<string, unknown>;
    [key: string]: unknown;
}
export interface ASTNode {
    type: string;
    kind?: string | number;
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
    [key: string]: unknown;
}
export interface ProjectContext {
    rootPath?: string;
    projectPath?: string;
    type?: string;
    language?: 'javascript' | 'typescript' | 'python' | 'java' | 'csharp' | 'go' | 'rust' | 'other';
    languages?: string[];
    testFramework?: string;
    framework?: string;
    packageJson?: PackageJsonConfig;
    tsConfig?: TSConfig;
    dependencies?: Record<string, string> | string[];
    testFiles?: TestFile[];
    sourceFiles?: string[];
    configuration?: Record<string, unknown>;
    customConfig?: Record<string, unknown>;
    filePatterns?: {
        test: string[];
        source: string[];
        ignore: string[];
    };
    metadata?: BaseMetadata;
}
export interface TestFile {
    path: string;
    content: string;
    framework?: string;
    testMethods?: TestMethod[];
    testCount?: number;
    hasTests?: boolean;
    ast?: ASTNode;
    metadata?: {
        framework?: string;
        language: string;
        lastModified: Date;
        size?: number;
        encoding?: string;
    };
}
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
    content?: string;
    body?: string;
    filePath?: string;
    signature?: string | MethodSignature;
    testType?: 'unit' | 'integration' | 'e2e' | 'security' | 'performance' | 'smoke';
    securityRelevance?: number;
}
//# sourceMappingURL=project-context.d.ts.map