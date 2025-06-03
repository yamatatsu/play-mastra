"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";

function App() {
	const runtime = useChatRuntime({
		api: "http://localhost:4111/api/agents/weatherAgent/stream",
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<main className="h-screen w-screen">
				<Thread />
			</main>
		</AssistantRuntimeProvider>
	);
}

export default App;
