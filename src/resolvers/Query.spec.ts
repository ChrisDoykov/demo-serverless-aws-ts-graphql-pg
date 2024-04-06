// Apollo and GraphQL
import { ApolloServer } from "@apollo/server";
import { loadSchemaSync } from "@graphql-tools/load";

// Utils
import { path } from "ramda";

// Schema
import rawSchema from "src/graphql.schema";

// Resolvers
import Query from "src/resolvers/Query";
import Mutation from "src/resolvers/Mutation";

// Types
import { MutationResolvers, QueryResolvers } from "src/generated/graphql";

const typeDefs = loadSchemaSync(rawSchema, { loaders: [] });

const resolvers = {
  Query,
  Mutation,
} as QueryResolvers & MutationResolvers;

let testServer: ApolloServer;

describe("authorization tests", function () {
  // Setup
  beforeAll(function () {
    testServer = new ApolloServer({
      typeDefs,
      resolvers,
    });
  });

  it("returns the correct response when user is not logged in", async () => {
    const response = await testServer.executeOperation(
      {
        query: "query HelloWorld { hello }",
      },
      {
        contextValue: {
          isAuth: false,
        },
      }
    );

    const errors = path(["body", "singleResult", "errors"], response);
    const message = path(["body", "singleResult", "data", "hello"], response);

    expect(errors).toBeUndefined();
    expect(message).toBe("Someone's been a bad boy ;)");
  });

  it("returns the correct response when user is logged in", async () => {
    const response = await testServer.executeOperation(
      {
        query: "query HelloWorld { hello }",
      },
      {
        contextValue: {
          isAuth: true,
        },
      }
    );

    const errors = path(["body", "singleResult", "errors"], response);
    const message = path(["body", "singleResult", "data", "hello"], response);

    expect(errors).toBeUndefined();
    expect(message).toBe("Hello world!");
  });
});
