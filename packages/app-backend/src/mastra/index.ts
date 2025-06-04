import { Mastra } from "@mastra/core";
// @ts-expect-error mastraのリポジトリにバグが報告されている。https://github.com/mastra-ai/mastra/issues/4593
import { DynamoDBStore } from "@mastra/dynamodb";
import { PinoLogger } from "@mastra/loggers";
import { grafanaAgent } from "./agents/grafana-agent";
import { weatherAgent } from "./agents/weather-agent";
import bearerAuth from "./middlewares/bearerAuth";
import { weatherWorkflow } from "./workflows/weather-workflow";

export const mastra = new Mastra({
	server: {
		middleware: [bearerAuth],
		cors: {
			origin: process.env.CORS_ORIGIN?.split(",") ?? "No origin permitted",
		},
	},
	workflows: { weatherWorkflow },
	agents: { weatherAgent, grafanaAgent },
	storage: new DynamoDBStore({
		name: "dynamodb",
		config: {
			tableName: "mastra-storage-table",
			region: "ap-northeast-1",
		},
	}),
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
});
