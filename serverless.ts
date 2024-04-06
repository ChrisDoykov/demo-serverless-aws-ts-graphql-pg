import type { AWS } from "@serverless/typescript";
import { graphql } from "./src/functions";

const serverlessConfiguration: AWS = {
  service: "sls-gql-ts-api",
  frameworkVersion: "3",
  plugins: [
    "serverless-esbuild",
    "serverless-domain-manager",
    "serverless-offline",
  ],
  useDotenv: true,
  provider: {
    name: "aws",
    // @ts-expect-error Region needs to be provided dynamically
    region: "${env:TF_VAR_region}",
    // @ts-expect-error Node version also provided dynamically
    runtime: "nodejs${env:NODE_VERSION}.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    stage: "${opt:stage, 'dev'}",
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      POSTGRES_URL: "${env:POSTGRES_URL}",
      APP_SECRET: "${env:APP_SECRET}",
      NODE_ENV: "${env:NODE_ENV}",
      ALLOWED_ORIGINS: "${env:ALLOWED_ORIGINS}",
      TF_VAR_domain_name: "${env:TF_VAR_domain_name}",
    },
  },
  // import the function via paths
  functions: { graphql },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["@aws-sdk"],
      target: "node${env:NODE_VERSION}",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
    "serverless-offline": {
      httpPort: 4000,
    },
    domainName: {
      dev: "dev.${env:TF_VAR_domain_name}",
      staging: "staging.${env:TF_VAR_domain_name}",
      production: "${env:TF_VAR_domain_name}",
    },
    customDomain: {
      domainName: "${self:custom.domainName.${opt:stage, 'dev'}}",
      stage: "${opt:stage, 'dev'}",
      certificateName: "${env:TF_VAR_domain_name}",
      createRoute53Record: true,
      createRoute53IPv6Record: true,
      endpointType: "regional",
      securityPolicy: "${env:DOMAIN_SECURITY_POLICY}",
      apiType: "rest",
      autoDomain: true,
    },
  },
};
module.exports = serverlessConfiguration;
