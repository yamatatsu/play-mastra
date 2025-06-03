import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { Agent } from "@mastra/core/agent";
import { weatherTool } from "../tools/weather-tool";

const bedrock = createAmazonBedrock({
	region: "us-east-1",
});
const model = bedrock("us.anthropic.claude-sonnet-4-20250514-v1:0");

export const weatherAgent = new Agent({
	name: "Weather Agent",
	instructions: `You are a helpful weather assistant that provides accurate weather information.
 
Your primary function is to help users get weather details for specific locations. When responding:
- Always ask for a location if none is provided
- If the location name isn't in English, please translate it
- Include relevant details like humidity, wind conditions, and precipitation
- Keep responses concise but informative
 
Use the weatherTool to fetch current weather data.`,
	model: model,
	tools: { weatherTool },
});
