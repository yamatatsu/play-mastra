import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { Agent } from "@mastra/core/agent";
import { grafanaMcpTools } from "../tools/grafana-mcp-tools";

const bedrock = createAmazonBedrock({
	region: "us-east-1",
	credentialProvider: fromNodeProviderChain(),
});
const model = bedrock("us.anthropic.claude-sonnet-4-20250514-v1:0");

export const grafanaAgent = new Agent({
	name: "Grafana Agent",
	instructions: `あなたはGrafanaのダッシュボードを操作するためのアシスタントです。

あなたの主な機能は、ユーザーにGrafanaのダッシュボードを操作するためのツールを提供することです。
 
Grafanaのダッシュボードを操作するためのMCPを使用してください。`,
	model: model,
	tools: { ...grafanaMcpTools },
});
