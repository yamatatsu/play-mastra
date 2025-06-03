import type { ResourcesConfig } from "aws-amplify";
const awsConfig = {
	Auth: {
		Cognito: {
			userPoolId: import.meta.env.VITE_AWS_USER_POOLS_ID,
			userPoolClientId: import.meta.env.VITE_AWS_USER_POOLS_WEB_CLIENT_ID,
			loginWith: {
				username: true,
				email: true,
			},
		},
	},
} satisfies ResourcesConfig;
export default awsConfig;
