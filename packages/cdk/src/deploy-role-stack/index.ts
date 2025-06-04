import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

const OWNER = "yamatatsu";
const REPO = "play-mastra";
/**
 * NOTE: デプロイ対象のgit branchを制限できる。
 * 今後の運用の拡張性を踏まえて、ここでは特に制約を設けない。
 * これによるセキュリティ上の懸念はないと判断した。
 */
const FILTER = "*";

const IAM_REPO_DEPLOY_ACCESS = `repo:${OWNER}/${REPO}:${FILTER ?? "*"}`;

/**
 * 以下の公式サンプルを参考にして実装した。
 * @see https://github.com/aws-samples/github-actions-oidc-cdk-construct/blob/9b9ecc9195c2e9b075fa5539e75da9df4596f68a/lib/github-actions-aws-auth-cdk-stack.ts
 */
export class DeployRoleStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: cdk.StackProps) {
		super(scope, id, props);

		// 新たにOIDC Providerを作成する場合
		// const githubProvider = new iam.OpenIdConnectProvider(
		// 	this,
		// 	"GithubActionsProvider",
		// 	{
		// 		url: "https://token.actions.githubusercontent.com",
		// 		clientIds: ["sts.amazonaws.com"],
		// 	},
		// );
		// すでに別のプロジェクトによって作られている場合
		const githubProvider =
			iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
				this,
				"GithubActionsProvider",
				this.formatArn({
					service: "iam",
					region: "",
					resource: "oidc-provider",
					resourceName: "token.actions.githubusercontent.com",
				}),
			);

		/**
		 * 参考にした公式サンプルだと、そのままでは動かない。
		 * 公式にもIssueが上がっているが、ここの設定についてはICASUのサンプルも参考にした。
		 * @see https://github.com/aws-samples/github-actions-oidc-cdk-construct/issues/5
		 * @see https://github.com/classmethod-internal/icasu-cdk-ecs-fargate-sample/blob/a7d882943bec299ba98001258b2ce5b7c8bfee04/packages/iac/lib/deploy-role-stack.ts#L27-L29
		 */
		const conditions: iam.Conditions = {
			StringLike: {
				"token.actions.githubusercontent.com:sub": IAM_REPO_DEPLOY_ACCESS,
				"token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
			},
		};

		new iam.Role(this, "gitHubDeployRole", {
			roleName: "play-mastra-github-deploy-role",
			assumedBy: new iam.WebIdentityPrincipal(
				githubProvider.openIdConnectProviderArn,
				conditions,
			),
			managedPolicies: [
				iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess"),
			],
			description:
				"This role is used via GitHub Actions to deploy with AWS CDK on the target AWS account",
			maxSessionDuration: cdk.Duration.hours(12),
		});
	}
}
