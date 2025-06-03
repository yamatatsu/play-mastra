"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { MastraChatModelAdapter } from "@/lib/mastra-runtime";
import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { Authenticator, translations } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import awsConfig from "@/aws-exports";
import { Amplify } from "aws-amplify";
import { I18n } from "aws-amplify/utils";

I18n.putVocabularies(translations);
I18n.setLanguage("ja");

Amplify.configure(awsConfig);

function App() {
	const runtime = useLocalRuntime(MastraChatModelAdapter);

	return (
		<Authenticator hideSignUp>
			<AssistantRuntimeProvider runtime={runtime}>
				<main className="h-screen w-screen">
					<Thread />
				</main>
			</AssistantRuntimeProvider>
		</Authenticator>
	);
}

export default App;
