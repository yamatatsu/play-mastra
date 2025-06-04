import * as cdk from "aws-cdk-lib";
import { BackendStack } from "./backend-stack";
// import { FrontendStack } from "./frontend-stack";

const app = new cdk.App();

new BackendStack(app, "PlayMastraBackend", {});
