"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { MastraChatModelAdapter } from "@/lib/mastra-runtime";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";

function App() {
	const runtime = useLocalRuntime(MastraChatModelAdapter);

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<main className="h-screen w-screen">
				<Thread />
			</main>
		</AssistantRuntimeProvider>
	);
}

export default App;
