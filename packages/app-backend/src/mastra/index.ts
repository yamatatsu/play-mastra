import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import { grafanaAgent } from "./agents/grafana-agent";
import { weatherAgent } from "./agents/weather-agent";
import bearerAuth from "./middlewares/bearerAuth";
import { weatherWorkflow } from "./workflows/weather-workflow";

export const mastra = new Mastra({
	server: {
		middleware: [bearerAuth],
		cors: {
			// TODO: 環境変数で差し替えれるようにする
			origin: process.env.CORS_ORIGIN?.split(",") ?? "No origin permitted",
		},
	},
	workflows: { weatherWorkflow },
	agents: { weatherAgent, grafanaAgent },
	storage: new LibSQLStore({
		// stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
		url: ":memory:",
	}),
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
});
