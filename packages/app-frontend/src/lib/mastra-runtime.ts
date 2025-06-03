import type { ChatModelAdapter } from "@assistant-ui/react";
import { MastraClient } from "@mastra/client-js";
import { fetchAuthSession } from "aws-amplify/auth";

// assistant-ui用のChatModelAdapterを作成
export const MastraChatModelAdapter: ChatModelAdapter = {
	async run({ messages }) {
		try {
			const authSession = await fetchAuthSession();
			const mastraClient = new MastraClient({
				baseUrl: import.meta.env.VITE_API_URL,
				headers: {
					Authorization: `Bearer ${authSession.tokens?.idToken}`,
				},
			});
			const agent = mastraClient.getAgent("grafanaAgent");

			// メッセージを適切な形式に変換
			const mastraMessages = messages.map((message) => ({
				role: message.role as "user" | "assistant" | "system",
				content:
					typeof message.content === "string"
						? message.content
						: message.content
								.filter((c) => c.type === "text")
								.map((c) => c.text)
								.join(""),
			}));

			// Mastraエージェントからレスポンスを取得
			const response = await agent.generate({
				messages: mastraMessages,
			});

			return {
				content: [{ type: "text", text: response.text }],
			};
		} catch (error) {
			// AbortErrorは正常なキャンセル
			if (error instanceof Error && error.name === "AbortError") {
				return {};
			}

			// その他のエラーは再スロー
			throw error;
		}
	},
};

// ストリーミングレスポンスをサポートする場合は、以下のように実装できます。
// ただし、streamingリクエストではheadersを設定できず、APIの認証機構を実装することができないため、
// 現在のところ、ストリーミングは使用していません。
//
// const _StreamAdapter: ChatModelAdapter = {
// 	async *run({ messages, abortSignal }) {
// 		try {
// 			// MastraのgrafanaAgentを取得
// 			const authSession = await fetchAuthSession();
// 			const mastraClient = new MastraClient({
// 				baseUrl: import.meta.env.VITE_API_URL,
// 				headers: {
// 					Authorization: `Bearer ${authSession.tokens?.idToken}`,
// 				},
// 			});
// 			const agent = mastraClient.getAgent("grafanaAgent");

// 			// メッセージを適切な形式に変換
// 			const mastraMessages = messages.map((message) => ({
// 				role: message.role as "user" | "assistant" | "system",
// 				content:
// 					typeof message.content === "string"
// 						? message.content
// 						: message.content
// 								.filter((c) => c.type === "text")
// 								.map((c) => c.text)
// 								.join(""),
// 			}));

// 			// Mastraエージェントからストリーミングレスポンスを取得
// 			const response = await agent.stream({ messages: mastraMessages });

// 			// レスポンスのbodyからストリームを取得
// 			if (!response.body) {
// 				throw new Error("No response body");
// 			}

// 			const reader = response.body.getReader();
// 			const decoder = new TextDecoder();
// 			let accumulatedText = "";

// 			try {
// 				while (true) {
// 					// abortSignalをチェック
// 					if (abortSignal?.aborted) {
// 						reader.cancel();
// 						return;
// 					}

// 					const { done, value } = await reader.read();
// 					if (done) break;

// 					const chunk = decoder.decode(value, { stream: true });
// 					const lines = chunk.split("\n");

// 					for (const line of lines) {
// 						if (line.trim() === "") continue;

// 						// Mastraのストリーミング形式を解析
// 						if (line.startsWith("0:")) {
// 							// テキストコンテンツの行
// 							const textMatch = line.match(/^0:"(.*)"/);
// 							if (textMatch) {
// 								const text = textMatch[1];
// 								accumulatedText += text;

// 								// assistant-ui形式でyield
// 								yield {
// 									content: [
// 										{
// 											type: "text",
// 											text: accumulatedText,
// 										},
// 									],
// 								};
// 							}
// 						}
// 					}
// 				}
// 			} finally {
// 				reader.releaseLock();
// 			}
// 		} catch (error) {
// 			// AbortErrorは正常なキャンセル
// 			if (error instanceof Error && error.name === "AbortError") {
// 				return;
// 			}

// 			// その他のエラーは再スロー
// 			throw error;
// 		}
// 	},
// };
