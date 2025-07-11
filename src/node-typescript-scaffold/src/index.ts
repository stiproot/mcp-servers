import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { ProjectScaffolder } from "./scaffolder.js";

const server = new McpServer(
  {
    name: "node-typescript-scaffold-mcp",
    version: "1.0.0",
  },
);

const scaffolder = new ProjectScaffolder();

server.tool(
  "create-node-project",
  "Create a new Node.js TypeScript project with common configurations",
  {
    projectName: z.string().describe("The name of the project"),
    projectPath: z.string().describe("The path where the project should be created"),
    template: z.enum(["basic", "express", "cli", "library"]).default("basic").describe("The project template to use"),
    packageManager: z.enum(["npm", "yarn", "pnpm"]).default("npm").describe("The package manager to use"),
    includeTests: z.boolean().default(true).describe("Whether to include test configuration"),
    includeLinting: z.boolean().default(true).describe("Whether to include ESLint and Prettier"),
    includeGitignore: z.boolean().default(true).describe("Whether to include .gitignore file"),
  },
  async ({ projectName, projectPath, template, packageManager, includeTests, includeLinting, includeGitignore }) => {

    try {
      const options = {
        projectName: projectName as string,
        projectPath: projectPath as string,
        template: (template as string) || "basic",
        packageManager: (packageManager as string) || "npm",
        includeTests: includeTests !== false,
        includeLinting: includeLinting !== false,
        includeGitignore: includeGitignore !== false,
      };

      const result = await scaffolder.createProject(options);
      return {
        content: [
          {
            type: "text",
            text: `✅ Project created successfully!\n\nProject: ${options.projectName}\nPath: ${result.projectPath}\nTemplate: ${options.template}\n\nNext steps:\n1. cd ${result.projectPath}\n2. ${options.packageManager} install\n3. ${options.packageManager} run dev\n\nFiles created:\n${result.filesCreated.map(f => `- ${f}`).join('\n')}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error creating project: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

//     case "list_templates":
//       const templates = scaffolder.getAvailableTemplates();
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Available templates:\n\n${templates.map(t => `**${t.name}**\n${t.description}\n`).join('\n')}`,
//           },
//         ],
//       };

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
