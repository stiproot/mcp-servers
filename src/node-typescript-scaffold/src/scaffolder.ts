import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ProjectOptions {
  projectName: string;
  projectPath: string;
  template: string;
  packageManager: string;
  includeTests: boolean;
  includeLinting: boolean;
  includeGitignore: boolean;
}

export interface ProjectResult {
  projectPath: string;
  filesCreated: string[];
}

export interface Template {
  name: string;
  description: string;
  files: Record<string, string | ((options: ProjectOptions) => string)>;
  dependencies: string[];
  devDependencies: string[];
}

export class ProjectScaffolder {
  private templates: Record<string, Template> = {
    basic: {
      name: "basic",
      description: "Basic Node.js TypeScript project with minimal setup",
      files: {
        "src/index.ts": `console.log("Hello, TypeScript!");`,
        "README.md": this.generateReadme,
      },
      dependencies: [],
      devDependencies: ["typescript", "@types/node"],
    },
    express: {
      name: "express",
      description: "Express.js web server with TypeScript",
      files: {
        "src/index.ts": this.generateExpressIndex,
        "src/routes/index.ts": this.generateExpressRoutes,
        "README.md": this.generateReadme,
      },
      dependencies: ["express"],
      devDependencies: ["typescript", "@types/node", "@types/express"],
    },
    cli: {
      name: "cli",
      description: "Command-line interface application with TypeScript",
      files: {
        "src/index.ts": this.generateCliIndex,
        "src/commands/index.ts": this.generateCliCommands,
        "README.md": this.generateReadme,
      },
      dependencies: ["commander"],
      devDependencies: ["typescript", "@types/node"],
    },
    library: {
      name: "library",
      description: "TypeScript library with proper build configuration",
      files: {
        "src/index.ts": this.generateLibraryIndex,
        "src/lib/example.ts": this.generateLibraryExample,
        "README.md": this.generateReadme,
      },
      dependencies: [],
      devDependencies: ["typescript", "@types/node"],
    },
  };

  getAvailableTemplates(): Template[] {
    return Object.values(this.templates);
  }

  async createProject(options: ProjectOptions): Promise<ProjectResult> {
    const template = this.templates[options.template];
    if (!template) {
      throw new Error(`Template "${options.template}" not found`);
    }

    const fullProjectPath = path.resolve(options.projectPath, options.projectName);
    const filesCreated: string[] = [];

    // Create project directory
    await fs.mkdir(fullProjectPath, { recursive: true });

    // Create package.json
    const packageJson = this.generatePackageJson(options, template);
    await fs.writeFile(
      path.join(fullProjectPath, "package.json"),
      JSON.stringify(packageJson, null, 2)
    );
    filesCreated.push("package.json");

    // Create tsconfig.json
    const tsConfig = this.generateTsConfig(options);
    await fs.writeFile(
      path.join(fullProjectPath, "tsconfig.json"),
      JSON.stringify(tsConfig, null, 2)
    );
    filesCreated.push("tsconfig.json");

    // Create template files
    for (const [filePath, content] of Object.entries(template.files)) {
      const fullPath = path.join(fullProjectPath, filePath);
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });

      const fileContent = typeof content === "function" ? content(options) : content;
      await fs.writeFile(fullPath, fileContent);
      filesCreated.push(filePath);
    }

    // Create .gitignore if requested
    if (options.includeGitignore) {
      const gitignore = this.generateGitignore();
      await fs.writeFile(path.join(fullProjectPath, ".gitignore"), gitignore);
      filesCreated.push(".gitignore");
    }

    // Create linting configuration if requested
    if (options.includeLinting) {
      const eslintConfig = this.generateEslintConfig();
      await fs.writeFile(
        path.join(fullProjectPath, ".eslintrc.json"),
        JSON.stringify(eslintConfig, null, 2)
      );
      filesCreated.push(".eslintrc.json");

      const prettierConfig = this.generatePrettierConfig();
      await fs.writeFile(
        path.join(fullProjectPath, ".prettierrc"),
        JSON.stringify(prettierConfig, null, 2)
      );
      filesCreated.push(".prettierrc");
    }

    // Create test configuration if requested
    if (options.includeTests) {
      const jestConfig = this.generateJestConfig();
      await fs.writeFile(
        path.join(fullProjectPath, "jest.config.js"),
        jestConfig
      );
      filesCreated.push("jest.config.js");

      // Create a sample test file
      const testDir = path.join(fullProjectPath, "src", "__tests__");
      await fs.mkdir(testDir, { recursive: true });
      const sampleTest = this.generateSampleTest(options);
      await fs.writeFile(path.join(testDir, "index.test.ts"), sampleTest);
      filesCreated.push("src/__tests__/index.test.ts");
    }

    return {
      projectPath: fullProjectPath,
      filesCreated,
    };
  }

  private generatePackageJson(options: ProjectOptions, template: Template) {
    const basePackage: any = {
      name: options.projectName,
      version: "1.0.0",
      description: "",
      main: "dist/index.js",
      scripts: {
        build: "tsc",
        dev: "tsc --watch",
        start: "node dist/index.js",
      },
      keywords: [],
      author: "",
      license: "ISC",
      dependencies: {},
      devDependencies: {},
    };

    // Add template-specific dependencies
    template.dependencies.forEach((dep) => {
      basePackage.dependencies[dep] = "latest";
    });

    template.devDependencies.forEach((dep) => {
      basePackage.devDependencies[dep] = "latest";
    });

    // Add testing dependencies if requested
    if (options.includeTests) {
      basePackage.devDependencies.jest = "latest";
      basePackage.devDependencies["@types/jest"] = "latest";
      basePackage.devDependencies["ts-jest"] = "latest";
      basePackage.scripts.test = "jest";
      basePackage.scripts["test:watch"] = "jest --watch";
    }

    // Add linting dependencies if requested
    if (options.includeLinting) {
      basePackage.devDependencies.eslint = "latest";
      basePackage.devDependencies["@typescript-eslint/parser"] = "latest";
      basePackage.devDependencies["@typescript-eslint/eslint-plugin"] = "latest";
      basePackage.devDependencies.prettier = "latest";
      basePackage.scripts.lint = "eslint src/**/*.ts";
      basePackage.scripts["lint:fix"] = "eslint src/**/*.ts --fix";
      basePackage.scripts.format = "prettier --write src/**/*.ts";
    }

    // Add CLI-specific configuration
    if (options.template === "cli") {
      basePackage.bin = {
        [options.projectName]: "./dist/index.js",
      };
    }

    return basePackage;
  }

  private generateTsConfig(options: ProjectOptions) {
    return {
      compilerOptions: {
        target: "ES2020",
        module: "commonjs",
        lib: ["ES2020"],
        outDir: "./dist",
        rootDir: "./src",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: options.template === "library",
        declarationMap: options.template === "library",
        sourceMap: true,
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    };
  }

  private generateReadme(options: ProjectOptions): string {
    return `# ${options.projectName}

## Description

A TypeScript project generated with the ${options.template} template.

## Installation

\`\`\`bash
${options.packageManager} install
\`\`\`

## Development

\`\`\`bash
${options.packageManager} run dev
\`\`\`

## Build

\`\`\`bash
${options.packageManager} run build
\`\`\`

## Start

\`\`\`bash
${options.packageManager} start
\`\`\`

${options.includeTests ? `## Test

\`\`\`bash
${options.packageManager} test
\`\`\`

` : ''}${options.includeLinting ? `## Linting

\`\`\`bash
${options.packageManager} run lint
${options.packageManager} run format
\`\`\`

` : ''}## License

ISC
`;
  }

  private generateExpressIndex(options: ProjectOptions): string {
    return `import express from 'express';
import { router } from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', router);

app.get('/', (req, res) => {
  res.json({ message: 'Hello from ${options.projectName}!' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;
  }

  private generateExpressRoutes(options: ProjectOptions): string {
    return `import { Router } from 'express';

export const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/info', (req, res) => {
  res.json({
    name: '${options.projectName}',
    version: '1.0.0',
    description: 'Express.js TypeScript application'
  });
});
`;
  }

  private generateCliIndex(options: ProjectOptions): string {
    return `#!/usr/bin/env node

import { Command } from 'commander';
import { setupCommands } from './commands/index.js';

const program = new Command();

program
  .name('${options.projectName}')
  .description('CLI application built with TypeScript')
  .version('1.0.0');

setupCommands(program);

program.parse();
`;
  }

  private generateCliCommands(options: ProjectOptions): string {
    return `import { Command } from 'commander';

export function setupCommands(program: Command) {
  program
    .command('hello')
    .description('Say hello')
    .option('-n, --name <name>', 'Name to greet', 'World')
    .action((options) => {
      console.log(\`Hello, \${options.name}!\`);
    });

  program
    .command('info')
    .description('Show application information')
    .action(() => {
      console.log('${options.projectName} - v1.0.0');
      console.log('A CLI application built with TypeScript');
    });
}
`;
  }

  private generateLibraryIndex(options: ProjectOptions): string {
    return `export { ExampleClass } from './lib/example.js';

export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

export function add(a: number, b: number): number {
  return a + b;
}
`;
  }

  private generateLibraryExample(options: ProjectOptions): string {
    return `export class ExampleClass {
  private value: string;

  constructor(value: string) {
    this.value = value;
  }

  getValue(): string {
    return this.value;
  }

  setValue(value: string): void {
    this.value = value;
  }

  toString(): string {
    return \`ExampleClass(\${this.value})\`;
  }
}
`;
  }

  private generateGitignore(): string {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
node_modules/
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test

# parcel-bundler cache
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`;
  }

  private generateEslintConfig() {
    return {
      parser: "@typescript-eslint/parser",
      extends: [
        "eslint:recommended",
        "@typescript-eslint/recommended",
      ],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
      rules: {
        "@typescript-eslint/no-unused-vars": "error",
        "@typescript-eslint/explicit-function-return-type": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
      },
    };
  }

  private generatePrettierConfig() {
    return {
      semi: true,
      trailingComma: "es5",
      singleQuote: true,
      printWidth: 80,
      tabWidth: 2,
    };
  }

  private generateJestConfig(): string {
    return `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
};
`;
  }

  private generateSampleTest(options: ProjectOptions): string {
    return `describe('${options.projectName}', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('should add two numbers correctly', () => {
    const result = 2 + 2;
    expect(result).toBe(4);
  });
});
`;
  }
}