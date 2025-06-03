import path from "node:path";
import { fileURLToPath } from "node:url";
import { MCPClient } from "@mastra/mcp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mcpClient = new MCPClient({
	servers: {
		grafana: {
			command: path.join(__dirname, "../../../grafana-mcp/mcp-grafana"),
			args: [],
			env: {
				GRAFANA_URL: "https://yamatatsu.grafana.net/",
				GRAFANA_API_KEY: process.env.GRAFANA_API_KEY ?? "",
			},
		},
	},
});
export const grafanaMcpTools = await mcpClient.getTools();
