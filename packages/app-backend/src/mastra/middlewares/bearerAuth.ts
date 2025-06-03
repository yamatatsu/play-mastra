import { CognitoJwtVerifier } from "aws-jwt-verify";
import { JwtBaseError } from "aws-jwt-verify/error";
import { bearerAuth } from "hono/bearer-auth";
import pino from "pino";

const logger = pino();

/**
 * Authenticationヘッダー内のBearerトークンを検証するミドルウェア
 * @see https://hono.dev/docs/middleware/builtin/bearer-auth
 */
export default bearerAuth({
	verifyToken: async (token, c) => {
		/**
		 * AWS公式ドキュメントに載っているJWT from Cognitoの検証器
		 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html#amazon-cognito-user-pools-using-tokens-aws-jwt-verify
		 */
		const verifier = CognitoJwtVerifier.create({
			userPoolId: process.env.AWS_USER_POOLS_ID ?? "",
			clientId: process.env.AWS_USER_POOLS_WEB_CLIENT_ID ?? "",
			tokenUse: null, // id tokenとaccess tokenの両方を受け入れる
		});

		try {
			await verifier.verify(token);

			return true;
		} catch (err) {
			if (err instanceof JwtBaseError) {
				logger.info({ err }, "JWT verification failed");
				return false;
			}

			logger.error({ err }, "Unexpected error during JWT verification");
			throw err;
		}
	},
	noAuthenticationHeaderMessage: () => {
		logger.info("No authentication header");
		return { code: "authorization_failed", message: "Unauthorized" };
	},
	invalidAuthenticationHeaderMessage: () => {
		logger.info("Invalid authentication header");
		return { code: "authorization_failed", message: "Unauthorized" };
	},
	invalidTokenMessage: () => {
		logger.info("Invalid token");
		return { code: "authorization_failed", message: "Unauthorized" };
	},
});
