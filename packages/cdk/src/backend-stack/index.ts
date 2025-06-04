import * as apprunner from "@aws-cdk/aws-apprunner-alpha";
import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as assets from "aws-cdk-lib/aws-ecr-assets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

export interface Props extends cdk.StackProps {}

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

		new dynamodb.TableV2(this, "Table", {
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
	}
}
