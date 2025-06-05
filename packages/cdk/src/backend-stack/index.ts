import * as apprunner from "@aws-cdk/aws-apprunner-alpha";
import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as assets from "aws-cdk-lib/aws-ecr-assets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

export interface Props extends cdk.StackProps {
	frontendOrigin: string;
}

export class BackendStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: Props) {
		super(scope, id, props);

		// /////////////
		// Cognito

		const userPool = new cognito.UserPool(this, "Default", {
			selfSignUpEnabled: false,
			signInAliases: {
				username: false,
				email: true,
			},
			passwordPolicy: {
				tempPasswordValidity: cdk.Duration.days(7),
				requireLowercase: false,
				requireUppercase: false,
				requireDigits: false,
				requireSymbols: false,
				minLength: 8,
			},
			email: cognito.UserPoolEmail.withCognito(),
			accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
			deviceTracking: {
				challengeRequiredOnNewDevice: true,
				deviceOnlyRememberedOnUserPrompt: true,
			},

			removalPolicy: cdk.RemovalPolicy.DESTROY,
			deletionProtection: false,
		});
		const userPoolClient = userPool.addClient("UserPoolClient", {
			authFlows: {
				userSrp: true,
				user: true,
			},
			preventUserExistenceErrors: true,
			supportedIdentityProviders: [
				cdk.aws_cognito.UserPoolClientIdentityProvider.COGNITO,
			],
		});

		// /////////////
		// DynamoDB

		const table = new dynamodb.TableV2(this, "Table", {
			tableName: "mastra-storage-table",
			partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
			sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
			billing: dynamodb.Billing.onDemand(),
			encryption: dynamodb.TableEncryptionV2.awsManagedKey(),
			globalSecondaryIndexes: [
				{
					indexName: "gsi1",
					partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
					sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
				},
				{
					indexName: "gsi2",
					partitionKey: { name: "gsi2pk", type: dynamodb.AttributeType.STRING },
					sortKey: { name: "gsi2sk", type: dynamodb.AttributeType.STRING },
				},
			],
		});

		// /////////////
		// App Runner

		const service = new apprunner.Service(this, "Service", {
			cpu: apprunner.Cpu.ONE_VCPU,
			memory: apprunner.Memory.TWO_GB,
			source: apprunner.Source.fromAsset({
				asset: new assets.DockerImageAsset(this, "ImageAssets", {
					directory: "../../",
					platform: assets.Platform.LINUX_AMD64,
				}),
				imageConfiguration: {
					port: 4111,
					environmentVariables: {
						CORS_ORIGIN: `http://localhost:5173,http://localhost:5174,${props.frontendOrigin}`,
						AWS_USER_POOLS_ID: userPool.userPoolId,
						AWS_USER_POOLS_WEB_CLIENT_ID: userPoolClient.userPoolClientId,
						GRAFANA_MCP_PATH:
							"/prod/packages/app-backend/grafana-mcp/linux-amd",
					},
					environmentSecrets: {
						GRAFANA_URL: apprunner.Secret.fromSsmParameter(
							// NOTE: あらかじめ自前でssm parameterを作成しておく
							// `aws ssm put-parameter --name /play-mastra/grafana-url --type SecureString --value xxx`
							ssm.StringParameter.fromSecureStringParameterAttributes(
								this,
								"GrafanaUrl",
								{ parameterName: "/play-mastra/grafana-url", version: 2 },
							),
						),
						GRAFANA_API_KEY: apprunner.Secret.fromSsmParameter(
							// NOTE: あらかじめ自前でssm parameterを作成しておく
							// `aws ssm put-parameter --name /play-mastra/grafana-api-key --type SecureString --value xxx`
							ssm.StringParameter.fromSecureStringParameterAttributes(
								this,
								"GrafanaApiKey",
								{ parameterName: "/play-mastra/grafana-api-key", version: 2 },
							),
						),
					},
				},
			}),
		});
		table.grantReadWriteData(service);
		service.addToRolePolicy(
			new iam.PolicyStatement({
				actions: [
					"bedrock:InvokeModel",
					"bedrock:InvokeModelWithResponseStream",
				],
				resources: ["*"],
			}),
		);
	}
}
