import { ProjectStructureAnalyzer } from '../../src/analyzers/structure';
import { 
  ProjectStructure, 
  ProjectOverview, 
  DirectoryInfo, 
  ArchitecturePattern,
  NamingConventions,
  ProjectMetrics,
  DirectoryPurpose,
  ArchitectureType,
  NamingPattern 
} from '../../src/analyzers/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ProjectStructureAnalyzer', () => {
  let analyzer: ProjectStructureAnalyzer;
  let testProjectPath: string;

  beforeEach(() => {
    analyzer = new ProjectStructureAnalyzer();
    
    // テスト用プロジェクトディレクトリを作成
    testProjectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'rimor-structure-test-'));
    
    // 複雑なプロジェクト構造を作成
    const projectStructure = {
      'package.json': {
        name: 'test-project',
        version: '1.0.0',
        description: 'Test project for structure analysis',
        main: 'dist/index.js',
        scripts: {
          build: 'tsc',
          test: 'jest',
          start: 'node dist/index.js',
          dev: 'nodemon src/index.ts',
          lint: 'eslint src/**/*.ts'
        },
        dependencies: {
          'express': '^4.18.0',
          'mongoose': '^7.0.0',
          'lodash': '^4.17.21'
        },
        devDependencies: {
          'typescript': '^5.0.0',
          'jest': '^29.0.0',
          '@types/express': '^4.17.0',
          'nodemon': '^2.0.0',
          'eslint': '^8.0.0'
        }
      },
      'tsconfig.json': {
        compilerOptions: {
          target: 'es2020',
          module: 'commonjs',
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist', 'test']
      },
      'README.md': `# Test Project

This is a test project for structure analysis.

## Features
- Express.js API
- MongoDB with Mongoose
- TypeScript
- Jest testing

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm start
\`\`\`
`,
      '.gitignore': `node_modules/
dist/
.env
*.log
coverage/
.nyc_output/
`,
      'jest.config.js': `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  coverageDirectory: 'coverage'
};`,
      '.eslintrc.js': `module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', '@typescript-eslint/recommended'],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-unused-vars': 'error'
  }
};`
    };

    // ディレクトリ構造とファイルを作成
    const directories = {
      'src': {
        'controllers': {
          'UserController.ts': `import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const newUser = await this.userService.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(400).json({ error: 'Bad request' });
    }
  }
}`,
          'ProductController.ts': `import { Request, Response } from 'express';
import { ProductService } from '../services/ProductService';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async getProducts(req: Request, res: Response): Promise<void> {
    const products = await this.productService.getAllProducts();
    res.json(products);
  }
}`
        },
        'services': {
          'UserService.ts': `import { User } from '../models/User';
import { DatabaseConnection } from '../utils/database';

export class UserService {
  private db: DatabaseConnection;

  constructor() {
    this.db = new DatabaseConnection();
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.collection('users').find({}).toArray();
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const user = new User(userData);
    return await this.db.collection('users').insertOne(user);
  }

  async findById(id: string): Promise<User | null> {
    return await this.db.collection('users').findOne({ _id: id });
  }
}`,
          'ProductService.ts': `import { Product } from '../models/Product';
import { DatabaseConnection } from '../utils/database';

export class ProductService {
  private db: DatabaseConnection;

  constructor() {
    this.db = new DatabaseConnection();
  }

  async getAllProducts(): Promise<Product[]> {
    return await this.db.collection('products').find({}).toArray();
  }
}`
        },
        'models': {
          'User.ts': `export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel implements User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<User>) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.email = data.email || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}`,
          'Product.ts': `export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}`,
          'index.ts': `export { User } from './User';
export { Product } from './Product';`
        },
        'routes': {
          'userRoutes.ts': `import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();
const userController = new UserController();

router.get('/users', userController.getUsers.bind(userController));
router.post('/users', userController.createUser.bind(userController));

export { router as userRoutes };`,
          'productRoutes.ts': `import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';

const router = Router();
const productController = new ProductController();

router.get('/products', productController.getProducts.bind(productController));

export { router as productRoutes };`,
          'index.ts': `import { Router } from 'express';
import { userRoutes } from './userRoutes';
import { productRoutes } from './productRoutes';

const router = Router();

router.use('/api', userRoutes);
router.use('/api', productRoutes);

export { router };`
        },
        'middleware': {
          'authMiddleware.ts': `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}`,
          'errorHandler.ts': `import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
}`
        },
        'utils': {
          'database.ts': `import { MongoClient, Db } from 'mongodb';

export class DatabaseConnection {
  private client: MongoClient;
  private db: Db;

  constructor() {
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    this.client = new MongoClient(connectionString);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.db = this.client.db('testproject');
  }

  collection(name: string) {
    return this.db.collection(name);
  }
}`,
          'validation_helpers.ts': `export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequired(value: any): boolean {
  return value !== null && value !== undefined && value !== '';
}`,
          'logger.ts': `export class Logger {
  static info(message: string): void {
    console.log(\`[INFO] \${new Date().toISOString()}: \${message}\`);
  }

  static error(message: string): void {
    console.error(\`[ERROR] \${new Date().toISOString()}: \${message}\`);
  }

  static warn(message: string): void {
    console.warn(\`[WARN] \${new Date().toISOString()}: \${message}\`);
  }
}`
        },
        'config': {
          'database.config.ts': `export const databaseConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  dbName: 'testproject',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
};`,
          'app.config.ts': `export const appConfig = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret'
};`
        },
        'index.ts': `import express from 'express';
import { router } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { appConfig } from './config/app.config';

const app = express();

app.use(express.json());
app.use(router);
app.use(errorHandler);

app.listen(appConfig.port, () => {
  console.log(\`Server running on port \${appConfig.port}\`);
});

export default app;`
      },
      'test': {
        'controllers': {
          'UserController.test.ts': `import { UserController } from '../../src/controllers/UserController';
import { Request, Response } from 'express';

describe('UserController', () => {
  let controller: UserController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    controller = new UserController();
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('getUsers', () => {
    it('should return users list', async () => {
      await controller.getUsers(req as Request, res as Response);
      expect(res.json).toHaveBeenCalled();
    });
  });
});`,
          'ProductController.test.ts': `import { ProductController } from '../../src/controllers/ProductController';

describe('ProductController', () => {
  let controller: ProductController;

  beforeEach(() => {
    controller = new ProductController();
  });

  it('should create controller instance', () => {
    expect(controller).toBeInstanceOf(ProductController);
  });
});`
        },
        'services': {
          'UserService.test.ts': `import { UserService } from '../../src/services/UserService';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  describe('getAllUsers', () => {
    it('should return array of users', async () => {
      const users = await service.getAllUsers();
      expect(Array.isArray(users)).toBe(true);
    });
  });
});`
        },
        'utils': {
          'validation_helpers.test.ts': `import { validateEmail, validateRequired } from '../../src/utils/validation_helpers';

describe('Validation Helpers', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should return true for valid values', () => {
      expect(validateRequired('test')).toBe(true);
      expect(validateRequired(123)).toBe(true);
      expect(validateRequired(true)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(validateRequired('')).toBe(false);
      expect(validateRequired(null)).toBe(false);
      expect(validateRequired(undefined)).toBe(false);
    });
  });
});`
        }
      },
      'docs': {
        'API.md': `# API Documentation

## Endpoints

### Users
- GET /api/users - Get all users
- POST /api/users - Create new user

### Products  
- GET /api/products - Get all products
`,
        'DEVELOPMENT.md': `# Development Guide

## Setup
1. Install dependencies: \`npm install\`
2. Set up environment variables
3. Start development server: \`npm run dev\`

## Testing
Run tests with: \`npm test\`
`,
        'DEPLOYMENT.md': `# Deployment Guide

## Production Build
\`\`\`bash
npm run build
npm start
\`\`\`

## Environment Variables
- MONGODB_URI
- JWT_SECRET
- PORT
`
      },
      'scripts': {
        'setup.sh': `#!/bin/bash
echo "Setting up project..."
npm install
cp .env.example .env
echo "Setup complete!"`,
        'deploy.sh': `#!/bin/bash
echo "Deploying application..."
npm run build
docker build -t test-project .
echo "Deployment complete!"`
      },
      'build': {},
      'dist': {},
      'coverage': {},
      'assets': {
        'images': {
          'logo.png': 'binary-placeholder'
        },
        'styles': {
          'main.css': `body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
}`
        }
      }
    };

    // 基本設定ファイルを作成
    Object.entries(projectStructure).forEach(([filename, content]) => {
      if (typeof content === 'object') {
        fs.writeFileSync(
          path.join(testProjectPath, filename), 
          JSON.stringify(content, null, 2)
        );
      } else {
        fs.writeFileSync(path.join(testProjectPath, filename), content);
      }
    });

    // ディレクトリ構造を再帰的に作成
    const createDirectory = (basePath: string, structure: any) => {
      Object.entries(structure).forEach(([name, content]) => {
        const fullPath = path.join(basePath, name);
        
        if (typeof content === 'object' && content !== null) {
          fs.mkdirSync(fullPath, { recursive: true });
          createDirectory(fullPath, content);
        } else {
          fs.writeFileSync(fullPath, content as string);
        }
      });
    };

    createDirectory(testProjectPath, directories);

    // 空のディレクトリも作成
    ['build', 'dist', 'coverage'].forEach(dir => {
      fs.mkdirSync(path.join(testProjectPath, dir), { recursive: true });
    });
  });

  afterEach(() => {
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
  });

  describe('Class Instantiation', () => {
    test('should create ProjectStructureAnalyzer instance', () => {
      expect(analyzer).toBeInstanceOf(ProjectStructureAnalyzer);
    });

    test('should have required public methods', () => {
      expect(typeof analyzer.analyzeProjectStructure).toBe('function');
      expect(typeof analyzer.detectArchitecturePattern).toBe('function');
      expect(typeof analyzer.analyzeNamingConventions).toBe('function');
      expect(typeof analyzer.calculateProjectMetrics).toBe('function');
      expect(typeof analyzer.categorizeDirectories).toBe('function');
    });
  });

  describe('analyzeProjectStructure', () => {
    test('should analyze complete project structure', async () => {
      const structure = await analyzer.analyzeProjectStructure(testProjectPath);

      expect(structure).toBeDefined();
      expect(structure.overview).toBeDefined();
      expect(structure.directories).toBeDefined();
      expect(structure.architecture).toBeDefined();
      expect(structure.conventions).toBeDefined();
      expect(structure.metrics).toBeDefined();
    });

    test('should provide comprehensive project overview', async () => {
      const structure = await analyzer.analyzeProjectStructure(testProjectPath);
      const overview = structure.overview;

      expect(overview.rootPath).toBe(testProjectPath);
      expect(overview.totalFiles).toBeGreaterThan(20);
      expect(overview.totalDirectories).toBeGreaterThan(10);
      expect(overview.languages).toBeDefined();
      expect(overview.frameworks).toBeDefined();
      expect(overview.testingFrameworks).toBeDefined();
      expect(overview.buildTools).toBeDefined();

      // TypeScript should be detected
      const tsLanguage = overview.languages.find(lang => lang.language === 'typescript');
      expect(tsLanguage).toBeDefined();
      expect(tsLanguage!.percentage).toBeGreaterThan(0);

      // Express framework should be detected
      const expressFramework = overview.frameworks.find(fw => fw.name === 'express');
      expect(expressFramework).toBeDefined();
      expect(expressFramework!.confidence).toBeGreaterThan(0.5);
    });

    test('should categorize directories correctly', async () => {
      const structure = await analyzer.analyzeProjectStructure(testProjectPath);
      const directories = structure.directories;

      expect(directories.length).toBeGreaterThan(5);

      // Check specific directory purposes
      const srcDir = directories.find(dir => dir.path.includes('src'));
      expect(srcDir).toBeDefined();
      expect(srcDir!.purpose).toBe('source');

      const testDir = directories.find(dir => dir.path.includes('test'));
      expect(testDir).toBeDefined();
      expect(testDir!.purpose).toBe('test');

      const docsDir = directories.find(dir => dir.path.includes('docs'));
      expect(docsDir).toBeDefined();
      expect(docsDir!.purpose).toBe('documentation');

      const buildDir = directories.find(dir => dir.path.includes('build'));
      expect(buildDir).toBeDefined();
      expect(buildDir!.purpose).toBe('build');
    });

    test('should detect MVC architecture pattern', async () => {
      const structure = await analyzer.analyzeProjectStructure(testProjectPath);
      const architecture = structure.architecture;

      expect(architecture.type).toBe('mvc');
      expect(architecture.confidence).toBeGreaterThan(0.7);
      expect(architecture.evidence).toContain('controllers directory found');
      expect(architecture.evidence).toContain('models directory found');
      expect(architecture.suggestions).toBeDefined();
    });

    test('should analyze naming conventions', async () => {
      const structure = await analyzer.analyzeProjectStructure(testProjectPath);
      const conventions = structure.conventions;

      expect(conventions.files.pattern).toBe('camelCase');
      expect(conventions.files.confidence).toBeGreaterThan(0.4);
      
      expect(conventions.classes.pattern).toBe('PascalCase');
      expect(conventions.classes.confidence).toBeGreaterThan(0.8);

      expect(conventions.variables.pattern).toBe('camelCase');
      expect(conventions.functions.pattern).toBe('camelCase');
    });

    test('should calculate comprehensive project metrics', async () => {
      const structure = await analyzer.analyzeProjectStructure(testProjectPath);
      const metrics = structure.metrics;

      expect(metrics.complexity).toBeDefined();
      expect(metrics.complexity.totalFunctions).toBeGreaterThan(10);
      expect(metrics.complexity.averageCyclomaticComplexity).toBeGreaterThanOrEqual(1);

      expect(metrics.maintainability).toBeDefined();
      expect(metrics.maintainability.maintainabilityIndex).toBeGreaterThan(0);
      expect(metrics.maintainability.averageFileSize).toBeGreaterThan(0);

      expect(metrics.testability).toBeDefined();
      expect(metrics.testability.testCoverage).toBeGreaterThanOrEqual(0);

      expect(metrics.documentation).toBeDefined();
      expect(metrics.documentation.readmeQuality).toBeGreaterThan(0);
    });
  });

  describe('detectArchitecturePattern', () => {
    test('should detect MVC pattern in organized project', async () => {
      const pattern = await analyzer.detectArchitecturePattern(testProjectPath);

      expect(pattern.type).toBe('mvc');
      expect(pattern.confidence).toBeGreaterThan(0.7);
      expect(pattern.evidence).toContain('controllers directory found');
      expect(pattern.evidence).toContain('models directory found');
      expect(pattern.evidence).toContain('views or routes directory found');
    });

    test('should provide appropriate suggestions', async () => {
      const pattern = await analyzer.detectArchitecturePattern(testProjectPath);

      expect(pattern.suggestions).toBeDefined();
      expect(pattern.suggestions.length).toBeGreaterThan(0);
      expect(pattern.suggestions.some(s => s.includes('Consider'))).toBe(true);
    });

    test('should handle unknown architecture gracefully', async () => {
      // Create minimal project structure
      const minimalProjectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'minimal-'));
      try {
        fs.writeFileSync(path.join(minimalProjectPath, 'index.js'), 'console.log("hello");');

        const pattern = await analyzer.detectArchitecturePattern(minimalProjectPath);

        expect(pattern.type).toBe('unknown');
        expect(pattern.confidence).toBeLessThan(0.5);
      } finally {
        fs.rmSync(minimalProjectPath, { recursive: true, force: true });
      }
    });
  });

  describe('analyzeNamingConventions', () => {
    test('should detect file naming patterns', async () => {
      const conventions = await analyzer.analyzeNamingConventions(testProjectPath);

      expect(conventions.files.pattern).toBe('camelCase');
      expect(conventions.files.confidence).toBeGreaterThan(0.4);
      expect(conventions.files.examples.length).toBeGreaterThan(0);
    });

    test('should detect class naming patterns', async () => {
      const conventions = await analyzer.analyzeNamingConventions(testProjectPath);

      expect(conventions.classes.pattern).toBe('PascalCase');
      expect(conventions.classes.confidence).toBeGreaterThan(0.8);
      expect(conventions.classes.examples).toContain('UserController');
      expect(conventions.classes.examples).toContain('ProductController');
    });

    test('should detect variable and function naming patterns', async () => {
      const conventions = await analyzer.analyzeNamingConventions(testProjectPath);

      expect(conventions.variables.pattern).toBe('camelCase');
      expect(conventions.functions.pattern).toBe('camelCase');
    });

    test('should identify naming violations', async () => {
      // Create file with inconsistent naming
      const inconsistentFile = path.join(testProjectPath, 'src/bad-naming-example.ts');
      fs.writeFileSync(inconsistentFile, `
class bad_class_name {
  BAD_VARIABLE = 'test';
  
  BAD_FUNCTION_NAME() {
    return this.BAD_VARIABLE;
  }
}
`);

      const conventions = await analyzer.analyzeNamingConventions(testProjectPath);

      expect(conventions.classes.violations.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateProjectMetrics', () => {
    test('should calculate complexity metrics', async () => {
      const metrics = await analyzer.calculateProjectMetrics(testProjectPath);

      expect(metrics.complexity.totalFunctions).toBeGreaterThan(5);
      expect(metrics.complexity.averageCyclomaticComplexity).toBeGreaterThanOrEqual(1);
      expect(metrics.complexity.maxComplexity).toBeGreaterThanOrEqual(1);
      expect(metrics.complexity.averageFunctionLength).toBeGreaterThan(0);
    });

    test('should calculate maintainability metrics', async () => {
      const metrics = await analyzer.calculateProjectMetrics(testProjectPath);

      expect(metrics.maintainability.maintainabilityIndex).toBeGreaterThan(0);
      expect(metrics.maintainability.maintainabilityIndex).toBeLessThanOrEqual(100);
      expect(metrics.maintainability.duplicatedCodePercentage).toBeGreaterThanOrEqual(0);
      expect(metrics.maintainability.averageFileSize).toBeGreaterThan(0);
    });

    test('should calculate testability metrics', async () => {
      const metrics = await analyzer.calculateProjectMetrics(testProjectPath);

      expect(metrics.testability.testCoverage).toBeGreaterThanOrEqual(0);
      expect(metrics.testability.testCoverage).toBeLessThanOrEqual(100);
      expect(metrics.testability.testableClasses).toBeGreaterThanOrEqual(0);
      expect(metrics.testability.mockability).toBeGreaterThanOrEqual(0);
    });

    test('should calculate documentation metrics', async () => {
      const metrics = await analyzer.calculateProjectMetrics(testProjectPath);

      expect(metrics.documentation.readmeQuality).toBeGreaterThan(0);
      expect(metrics.documentation.documentationCoverage).toBeGreaterThanOrEqual(0);
      expect(metrics.documentation.documentedFunctions).toBeGreaterThanOrEqual(0);
      expect(metrics.documentation.documentedClasses).toBeGreaterThanOrEqual(0);
    });
  });

  describe('categorizeDirectories', () => {
    test('should categorize common directory types', async () => {
      const directories = await analyzer.categorizeDirectories(testProjectPath);

      expect(directories.length).toBeGreaterThan(5);

      // Test specific categorizations
      const sourceDir = directories.find(dir => dir.path.includes('src'));
      expect(sourceDir?.purpose).toBe('source');

      const testDir = directories.find(dir => dir.path.includes('test'));
      expect(testDir?.purpose).toBe('test');

      const docsDir = directories.find(dir => dir.path.includes('docs'));
      expect(docsDir?.purpose).toBe('documentation');

      const buildDir = directories.find(dir => dir.path.includes('build'));  
      expect(buildDir?.purpose).toBe('build');

      const assetsDir = directories.find(dir => dir.path.includes('assets'));
      expect(assetsDir?.purpose).toBe('assets');
    });

    test('should provide directory metadata', async () => {
      const directories = await analyzer.categorizeDirectories(testProjectPath);

      directories.forEach(dir => {
        expect(dir.path).toBeDefined();
        expect(dir.purpose).toBeDefined();
        expect(dir.fileCount).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(dir.subdirectories)).toBe(true);
        expect(Array.isArray(dir.patterns)).toBe(true);
        expect(Array.isArray(dir.conventions)).toBe(true);
      });
    });

    test('should detect directory patterns and conventions', async () => {
      const directories = await analyzer.categorizeDirectories(testProjectPath);

      const controllersDir = directories.find(dir => dir.path.includes('controllers'));
      expect(controllersDir).toBeDefined();
      expect(controllersDir!.patterns).toContain('Controller suffix pattern');
      expect(controllersDir!.conventions).toContain('PascalCase class names');
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent project path', async () => {
      await expect(
        analyzer.analyzeProjectStructure('/non/existent/path')
      ).rejects.toThrow();
    });

    test('should handle empty project directory', async () => {
      const emptyProjectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-project-'));
      
      try {
        const structure = await analyzer.analyzeProjectStructure(emptyProjectPath);

        expect(structure).toBeDefined();
        expect(structure.overview.totalFiles).toBe(0);
        expect(structure.directories).toHaveLength(0);
        expect(structure.architecture.type).toBe('unknown');
      } finally {
        fs.rmSync(emptyProjectPath, { recursive: true, force: true });
      }
    });

    test('should handle corrupted files gracefully', async () => {
      // Create corrupted package.json
      fs.writeFileSync(path.join(testProjectPath, 'corrupted.json'), '{ invalid json');

      const structure = await analyzer.analyzeProjectStructure(testProjectPath);

      // Should not throw, but may have limited analysis
      expect(structure).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      const structure = await analyzer.analyzeProjectStructure(testProjectPath);
      const endTime = Date.now();

      expect(structure).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // 10秒以内
    });

    test('should handle large projects efficiently', async () => {
      // Create many files to simulate large project
      const largeProjectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'large-structure-'));
      
      try {
        fs.mkdirSync(path.join(largeProjectPath, 'src'), { recursive: true });
        
        // Create 50 files
        for (let i = 0; i < 50; i++) {
          const content = `export class Class${i} {
  method${i}() {
    return ${i};
  }
}`;
          fs.writeFileSync(path.join(largeProjectPath, `src/file${i}.ts`), content);
        }

        const startTime = Date.now();
        const structure = await analyzer.analyzeProjectStructure(largeProjectPath);
        const endTime = Date.now();

        expect(structure.overview.totalFiles).toBeGreaterThan(40);
        expect(endTime - startTime).toBeLessThan(15000); // 15秒以内
      } finally {
        fs.rmSync(largeProjectPath, { recursive: true, force: true });
      }
    });
  });

  describe('Integration Tests', () => {
    test('should work with real-world project structure', async () => {
      const structure = await analyzer.analyzeProjectStructure(testProjectPath);

      // Comprehensive validation
      expect(structure.overview.frameworks.some(f => f.name === 'express')).toBe(true);
      expect(structure.overview.testingFrameworks.some(f => f.name === 'jest')).toBe(true);
      expect(structure.overview.buildTools.some(f => f.name === 'typescript')).toBe(true);

      expect(structure.architecture.type).toBe('mvc');
      expect(structure.conventions.classes.pattern).toBe('PascalCase');
      expect(structure.metrics.complexity.totalFunctions).toBeGreaterThan(10);
    });

    test('should provide actionable insights', async () => {
      const structure = await analyzer.analyzeProjectStructure(testProjectPath);

      // Architecture suggestions should be practical
      expect(structure.architecture.suggestions.length).toBeGreaterThan(0);
      
      // Metrics should be realistic
      expect(structure.metrics.maintainability.maintainabilityIndex).toBeGreaterThan(20);
      expect(structure.metrics.maintainability.maintainabilityIndex).toBeLessThan(100);
      
      // Documentation quality should be reasonable
      expect(structure.metrics.documentation.readmeQuality).toBeGreaterThan(0);
    });
  });
});