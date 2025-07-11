# Node.js TypeScript Scaffold MCP Server

A Model Context Protocol (MCP) server that provides tools for scaffolding Node.js TypeScript projects with different templates and configurations.

## Features

- **Multiple Templates**: Choose from basic, Express.js, CLI, or library project templates
- **Package Manager Support**: Works with npm, yarn, or pnpm
- **Optional Configuration**: Include testing, linting, and .gitignore files
- **File Generation**: Automatically generates project structure with proper TypeScript configuration

## Available Templates

1. **basic** - Basic Node.js TypeScript project with minimal setup
2. **express** - Express.js web server with TypeScript
3. **cli** - Command-line interface application with TypeScript
4. **library** - TypeScript library with proper build configuration

## Installation

```bash
npm install
npm run build
```

## Usage

### As an MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "node-typescript-scaffold": {
      "command": "node",
      "args": ["/path/to/node-typescript-scaffold-mcp/dist/index.js"]
    }
  }
}
```

### Testing with MCP Inspector

```bash
npm run inspector
```

### Available Tools

#### `create_node_project`

Creates a new Node.js TypeScript project with the specified configuration.

**Parameters:**
- `projectName` (required): The name of the project
- `projectPath` (required): The path where the project should be created
- `template` (optional): Project template - "basic", "express", "cli", or "library" (default: "basic")
- `packageManager` (optional): Package manager - "npm", "yarn", or "pnpm" (default: "npm")
- `includeTests` (optional): Whether to include test configuration (default: true)
- `includeLinting` (optional): Whether to include ESLint and Prettier (default: true)
- `includeGitignore` (optional): Whether to include .gitignore file (default: true)

**Example:**
```json
{
  "projectName": "my-new-project",
  "projectPath": "/path/to/projects",
  "template": "express",
  "packageManager": "npm",
  "includeTests": true,
  "includeLinting": true,
  "includeGitignore": true
}
```

#### `list_templates`

Lists all available project templates with their descriptions.

**Parameters:** None

## Generated Project Structure

Depending on the selected template and options, the generated project will include:

### Common Files (All Templates)
- `package.json` - Project configuration and dependencies
- `tsconfig.json` - TypeScript configuration
- `src/index.ts` - Main application file
- `README.md` - Project documentation
- `.gitignore` - Git ignore rules (if includeGitignore is true)

### Testing Files (if includeTests is true)
- `jest.config.js` - Jest configuration
- `src/__tests__/index.test.ts` - Sample test file

### Linting Files (if includeLinting is true)
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier configuration

### Template-Specific Files

**Express Template:**
- `src/routes/index.ts` - Express routes

**CLI Template:**
- `src/commands/index.ts` - CLI commands

**Library Template:**
- `src/lib/example.ts` - Library example

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch for changes
npm run dev

# Test the server
npm run inspector
```

## Example Usage

After creating a project with this MCP server, navigate to the project directory and run:

```bash
cd your-project-name
npm install
npm run dev
```

## License

MIT