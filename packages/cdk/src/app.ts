import * as cdk from "aws-cdk-lib";
import { BackendStack } from "./backend-stack";
import { DeployRoleStack } from "./deploy-role-stack";
import { FrontendStack } from "./frontend-stack";

const app = new cdk.App();

new DeployRoleStack(app, "PlayMastraDeployRole", {});
const frontendStack = new FrontendStack(app, "PlayMastraFrontend", {});
new BackendStack(app, "PlayMastraBackend", {
	frontendOrigin: `https://${frontendStack.distribution.distributionDomainName}`,
});
