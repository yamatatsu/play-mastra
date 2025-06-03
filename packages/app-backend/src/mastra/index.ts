import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { PinoLogger } from "@mastra/loggers";
import { grafanaAgent } from "./agents/grafana-agent";
import { weatherAgent } from "./agents/weather-agent";
import { weatherWorkflow } from "./workflows/weather-workflow";

export const mastra = new Mastra({
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
