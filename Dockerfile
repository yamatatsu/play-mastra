# App Runner上でapp-backendを動作させるためのDockerfileです
# - alpineではなくnode:slimを使う
#   - alpineでは、SnykやTrivyを用いてnodejsの脆弱性検知ができない
#   - see, https://snyk.io/jp/blog/choosing-the-best-node-js-docker-image/
# - マルチステージビルドを使う
#   - pnpm公式ドキュメントをリスペクト
#   - see, https://pnpm.io/docker#example-2-build-multiple-docker-images-in-a-monorepo
# - typescriptはtranspileせずにtsxで実行する

####################
# Base image

FROM node:24.1.0-slim AS base

# setup pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm@^10.10.0

# CA証明書のインストール
# Grafana MCPがAPIを実行する際にbase imageが持ってる証明書では不十分であるため
RUN apt-get update
RUN apt-get install ca-certificates -y

####################
# Build image

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run --filter=app-backend build
# mastra buildによって作成される`.mastra/output/node_modules`の中の`pino`(symbolic link)が、
# pnpm deployによって実態コピーされない。
# 本来あるべき位置にないnode_modulesディレクトリなので、動作が保証されないか。
# pnpm deployの利用を取りやめることで迂回する。
# RUN pnpm deploy --filter=app-backend /prod/app-backend

####################
# Application image

FROM base AS app-backend
# COPY --from=build /prod/app-backend /prod/app-backend
# WORKDIR /prod/app-backend
COPY --from=build /usr/src/app/node_modules /prod/node_modules
COPY --from=build /usr/src/app/packages/app-backend /prod/packages/app-backend
WORKDIR /prod/packages/app-backend

EXPOSE 4111
CMD [ "pnpm", "start" ]
