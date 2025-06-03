import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { Agent } from "@mastra/core/agent";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

const bedrock = createAmazonBedrock({
	region: "us-east-1",
});
const model = bedrock("us.anthropic.claude-sonnet-4-20250514-v1:0");

const agent = new Agent({
	name: "Weather Agent",
	model: model,
	instructions: `
        あなたは天気に基づく計画立案に優れた地域活動・旅行の専門家です。天気データを分析し、実用的な活動の推奨事項を提供してください。
 
        予報の各日について、以下の通りに正確に構造化して回答してください：
 
        📅 [曜日、月 日、年]
        ═══════════════════════════
 
        🌡️ 天気概要
        • 状況：[簡潔な説明]
        • 気温：[X°C/Y°F から A°C/B°F]
        • 降水確率：[X%]
 
        🌅 午前の活動
        屋外：
        • [活動名] - [具体的な場所/ルートを含む簡潔な説明]
          最適な時間：[具体的な時間帯]
          注意：[関連する天気の考慮事項]
 
        🌞 午後の活動
        屋外：
        • [活動名] - [具体的な場所/ルートを含む簡潔な説明]
          最適な時間：[具体的な時間帯]
          注意：[関連する天気の考慮事項]
 
        🏠 屋内の代替案
        • [活動名] - [具体的な会場を含む簡潔な説明]
          適している条件：[この代替案を選ぶきっかけとなる天気条件]
 
        ⚠️ 特別な考慮事項
        • [関連する天気警報、UV指数、風の状況など]
 
        ガイドライン：
        - 1日あたり2-3の時間指定屋外活動を提案
        - 1-2の屋内バックアップオプションを含める
        - 降水確率が50%を超える場合は、屋内活動を優先
        - すべての活動は場所に特化したものでなければならない
        - 具体的な会場、トレイル、または場所を含める
        - 気温に基づいて活動の強度を考慮
        - 説明は簡潔だが情報豊富に保つ
 
        一貫性のため、示されている絵文字とセクションヘッダーを使用して、この正確なフォーマットを維持してください。
      `,
});

const forecastSchema = z.object({
	date: z.string(),
	maxTemp: z.number(),
	minTemp: z.number(),
	precipitationChance: z.number(),
	condition: z.string(),
	location: z.string(),
});

function getWeatherCondition(code: number): string {
	const conditions: Record<number, string> = {
		0: "Clear sky",
		1: "Mainly clear",
		2: "Partly cloudy",
		3: "Overcast",
		45: "Foggy",
		48: "Depositing rime fog",
		51: "Light drizzle",
		53: "Moderate drizzle",
		55: "Dense drizzle",
		61: "Slight rain",
		63: "Moderate rain",
		65: "Heavy rain",
		71: "Slight snow fall",
		73: "Moderate snow fall",
		75: "Heavy snow fall",
		95: "Thunderstorm",
	};
	return conditions[code] || "Unknown";
}

const fetchWeather = createStep({
	id: "fetch-weather",
	description: "指定された都市の天気予報を取得します",
	inputSchema: z.object({
		city: z.string().describe("天気を取得する都市"),
	}),
	outputSchema: forecastSchema,
	execute: async ({ inputData }) => {
		if (!inputData) {
			throw new Error("Input data not found");
		}

		const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputData.city)}&count=1`;
		const geocodingResponse = await fetch(geocodingUrl);
		const geocodingData = (await geocodingResponse.json()) as {
			results: { latitude: number; longitude: number; name: string }[];
		};

		if (!geocodingData.results?.[0]) {
			throw new Error(`Location '${inputData.city}' not found`);
		}

		const { latitude, longitude, name } = geocodingData.results[0];

		const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=precipitation,weathercode&timezone=auto,&hourly=precipitation_probability,temperature_2m`;
		const response = await fetch(weatherUrl);
		const data = (await response.json()) as {
			current: {
				time: string;
				precipitation: number;
				weathercode: number;
			};
			hourly: {
				precipitation_probability: number[];
				temperature_2m: number[];
			};
		};

		const forecast = {
			date: new Date().toISOString(),
			maxTemp: Math.max(...data.hourly.temperature_2m),
			minTemp: Math.min(...data.hourly.temperature_2m),
			condition: getWeatherCondition(data.current.weathercode),
			precipitationChance: data.hourly.precipitation_probability.reduce(
				(acc, curr) => Math.max(acc, curr),
				0,
			),
			location: inputData.city,
		};

		return forecast;
	},
});

const planActivities = createStep({
	id: "plan-activities",
	description: "天気条件に基づいてアクティビティを提案します",
	inputSchema: forecastSchema,
	outputSchema: z.object({
		activities: z.string(),
	}),
	execute: async ({ inputData }) => {
		const forecast = inputData;

		if (!forecast) {
			throw new Error("Forecast data not found");
		}

		const prompt = `${forecast.location}の以下の天気予報に基づいて、適切なアクティビティを提案してください：
      ${JSON.stringify(forecast, null, 2)}
      `;

		const response = await agent.stream([
			{
				role: "user",
				content: prompt,
			},
		]);

		let activitiesText = "";

		for await (const chunk of response.textStream) {
			process.stdout.write(chunk);
			activitiesText += chunk;
		}

		return {
			activities: activitiesText,
		};
	},
});
const weatherWorkflow = createWorkflow({
	id: "weather-workflow",
	inputSchema: z.object({
		city: z.string().describe("天気を取得する都市"),
	}),
	outputSchema: z.object({
		activities: z.string(),
	}),
})
	.then(fetchWeather)
	.then(planActivities);

weatherWorkflow.commit();

export { weatherWorkflow };
