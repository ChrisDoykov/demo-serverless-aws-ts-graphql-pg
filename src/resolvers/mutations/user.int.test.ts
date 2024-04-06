// GraphQL and Apollo
import { GraphQLError } from "graphql";
import { ApolloServer } from "@apollo/server";
import { loadSchemaSync } from "@graphql-tools/load";

// Utils
import { head, omit, path, prop } from "ramda";

// Schema
import rawSchema from "src/graphql.schema";

// Resolvers
import Query from "src/resolvers/Query";
import Mutation from "src/resolvers/Mutation";

// Context
import DatabaseConnector from "src/database";
import { MutationResolvers, QueryResolvers } from "src/generated/graphql";
import { Context } from "@functions/graphql/context";

const typeDefs = loadSchemaSync(rawSchema, { loaders: [] });

const REGISTER_TEST_MUTATION = `mutation RegisterMutation($name: String!, $email: String!, $password: String!) { 
              register(name: $name, email: $email, password: $password) {
                name
              }
           }`;
const LOGIN_TEST_MUTATION = `mutation LoginMutation($email: String!, $password: String!) { 
              login(email: $email, password: $password) {
                name
              }
           }`;

const VARIABLES = {
  name: "Test Account",
  email: "test@noonesdomain.com",
  password: "1234567",
};

const resolvers = {
  Query,
  Mutation,
} as QueryResolvers & MutationResolvers;

let testServer: ApolloServer;
let db: DatabaseConnector;
let contextValue: Partial<Context>;

describe("authentication tests", function () {
  // Setup
  beforeAll(async function () {
    db = await DatabaseConnector.getInstance();
    testServer = new ApolloServer({
      typeDefs,
      resolvers,
    });

    contextValue = {
      db,
      testing: true,
    };

    // Ensure our test user does not exist
    await db.User.destroy({
      where: {
        email: prop("email", VARIABLES),
      },
    });
  });

  // ############################### ORDER MATTERS ###############################

  it("registering a user succeeds with correct input", async () => {
    const response = await testServer.executeOperation(
      {
        query: REGISTER_TEST_MUTATION,
        variables: VARIABLES,
      },
      {
        contextValue,
      }
    );

    const errors = path(["body", "singleResult", "errors"], response);
    const name = path(
      ["body", "singleResult", "data", "register", "name"],
      response
    );

    expect(errors).toBeUndefined();
    expect(name).toEqual(prop("name", VARIABLES));
  });

  it("registering a user fails when email is taken", async () => {
    const response = await testServer.executeOperation(
      {
        query: REGISTER_TEST_MUTATION,
        variables: VARIABLES,
      },
      {
        contextValue,
      }
    );

    const errors = path(
      ["body", "singleResult", "errors"],
      response
    ) as GraphQLError[];
    const errorMessage = prop("message", head(errors));

    expect(errors).toBeDefined();
    expect(errorMessage).toEqual("Failed to register! (Validation error)");
  });

  it("login succeeds with correct credentials", async () => {
    const response = await testServer.executeOperation(
      {
        query: LOGIN_TEST_MUTATION,
        variables: omit(["name"], VARIABLES),
      },
      {
        contextValue,
      }
    );

    const errors = path(["body", "singleResult", "errors"], response);
    const name = path(
      ["body", "singleResult", "data", "login", "name"],
      response
    );

    expect(errors).toBeUndefined();
    expect(name).toEqual(prop("name", VARIABLES));
  });

  it("login fails with incorrect credentials", async () => {
    const response = await testServer.executeOperation(
      {
        query: LOGIN_TEST_MUTATION,
        variables: {
          email: prop("email", VARIABLES),
          password: "wrongpass",
        },
      },
      {
        contextValue,
      }
    );
    const errors = path(
      ["body", "singleResult", "errors"],
      response
    ) as GraphQLError[];
    const errorMessage = prop("message", head(errors));

    expect(errors).toBeDefined();
    expect(errorMessage).toEqual("Incorrect password!");
  });
});
