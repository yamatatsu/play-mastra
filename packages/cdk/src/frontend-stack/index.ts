import * as cdk from "aws-cdk-lib";
import {
	CachePolicy,
	Function as CloudFrontFunction,
	Distribution,
	FunctionCode,
	FunctionEventType,
	FunctionRuntime,
	type IDistribution,
	ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import type { Construct } from "constructs";

interface Props extends cdk.StackProps {}

export class FrontendStack extends cdk.Stack {
	public readonly distribution: IDistribution;

	constructor(scope: Construct, id: string, props: Props) {
		super(scope, id, props);

		const websiteBucket = new s3.Bucket(this, "websiteBucket", {
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
			encryption: s3.BucketEncryption.S3_MANAGED,
			enforceSSL: true,
		});

		// /////////////
		// CloudFront Resources

		/**
		 * `/index.html`にforwardするためのCloudfront Function
		 */
		const defaultRequestFunctionAssociation = {
			eventType: FunctionEventType.VIEWER_REQUEST,
			function: new CloudFrontFunction(this, "DefaultRequestFunction", {
				functionName: "DefaultRequestFunction",
				runtime: FunctionRuntime.JS_2_0,
				code: FunctionCode.fromFile({
					filePath:
						"./src/frontend-stack/cloudfront-functions/default-viewer-request.js",
				}),
			}),
		};
		/**
		 * `/index.html`を返すとき、Cache-Controlを`no-cache`にするためのCloudfront Function
		 */
		const defaultResponseFunctionAssociation = {
			eventType: FunctionEventType.VIEWER_RESPONSE,
			function: new CloudFrontFunction(this, "DefaultResponseFunction", {
				functionName: "DefaultResponseFunction",
				runtime: FunctionRuntime.JS_2_0,
				code: FunctionCode.fromFile({
					filePath:
						"./src/frontend-stack/cloudfront-functions/default-viewer-response.js",
				}),
			}),
		};

		// cloudfront distribution
		const distribution = new Distribution(this, "Distribution", {
			defaultRootObject: "index.html",
			defaultBehavior: {
				origin: S3BucketOrigin.withOriginAccessControl(websiteBucket),
				viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
				cachePolicy: CachePolicy.CACHING_OPTIMIZED,
				functionAssociations: [
					defaultRequestFunctionAssociation,
					defaultResponseFunctionAssociation,
				],
			},
		});

		// Deploy the app to the S3 bucket
		new s3deploy.BucketDeployment(this, "DeployWebsite", {
			sources: [s3deploy.Source.asset("../app-frontend/dist")],
			destinationBucket: websiteBucket,
		});

		this.distribution = distribution;
	}
}
