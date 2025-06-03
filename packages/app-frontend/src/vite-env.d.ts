/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_URL: string;
	readonly VITE_AWS_USER_POOLS_ID: string;
	readonly VITE_AWS_USER_POOLS_WEB_CLIENT_ID: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
