// GraphQL and Apollo
import { GraphQLResolveInfo } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { loadSchemaSync } from "@graphql-tools/load";
import { ApolloServer } from "@apollo/server";

// Express related
import { expressMiddleware } from "@apollo/server/express4";
import serverlessExpress from "@codegenie/serverless-express";
import express from "express";

// Middleware
import cors from "cors";

// Depth Limiting
import depthLimit from "graphql-depth-limit";

// Rate Limiting
import {
  RateLimitArgs,
  defaultKeyGenerator,
  rateLimitDirective,
} from "graphql-rate-limit-directive";

// Utils
import { includes, isEmpty } from "ramda";
import { isLocalhost, isTest } from "src/libs/utils";

// Resolvers, typeDefs, and context
import resolvers from "src/resolvers";
import rawSchema from "src/graphql.schema";
import { Context, generateContext } from "./context";

// Constants
import { ORIGIN_WHITELIST } from "src/consts";

const typeDefs = loadSchemaSync(rawSchema, { loaders: [] });

// Specifes how the rate limiter should determine operation uniqueness
const keyGenerator = (
  directiveArgs: RateLimitArgs,
  obj: unknown,
  args: { [key: string]: unknown },
  context: Context,
  info: GraphQLResolveInfo
) =>
  `${context.ip}:${defaultKeyGenerator(
    directiveArgs,
    obj,
    args,
    context,
    info
  )}`;

// Enable the rate-limiter directive
const { rateLimitDirectiveTypeDefs, rateLimitDirectiveTransformer } =
  rateLimitDirective({ keyGenerator });

// Create the schema
const schema = rateLimitDirectiveTransformer(
  makeExecutableSchema({
    typeDefs: [rateLimitDirectiveTypeDefs, typeDefs],
    resolvers,
  })
);

// Set up Apollo Server
const server = new ApolloServer({
  schema,
  validationRules: [depthLimit(7)],
});

// Lambda + Express Middleware specific
server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();

const app = express();

app.use(
  cors({
    origin: (origin, callback) =>
      // Allow requests if localhost
      isTest ||
      isLocalhost ||
      // if the whitelist is empty or all hosts are allowed
      isEmpty(ORIGIN_WHITELIST) ||
      includes("*", ORIGIN_WHITELIST) ||
      // or if the origin is whitelisted explicitly
      includes(origin, ORIGIN_WHITELIST)
        ? callback(null, true)
        : callback(new Error("Forbidden origin.")),
    credentials: true,
  }),
  express.json(),
  expressMiddleware(server, {
    // The Express request and response objects are passed into
    // your context initialization function
    context: async ({ req, res }): Promise<Context> =>
      await generateContext({ req, res }),
  })
);

export const graphqlHandler = serverlessExpress({ app });
