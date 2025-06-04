import path from "node:path";
import { fileURLToPath } from "node:url";
import { MCPClient } from "@mastra/mcp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mcpClient = new MCPClient({
	servers: {
		grafana: {
			command: process.env.GRAFANA_MCP_PATH ?? "",
			args: [],
			env: {
				GRAFANA_URL: process.env.GRAFANA_URL ?? "",
				GRAFANA_API_KEY: process.env.GRAFANA_API_KEY ?? "",
			},
		},
	},
});
export const grafanaMcpTools = await mcpClient.getTools();
