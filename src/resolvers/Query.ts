import { QueryResolvers } from "src/generated/graphql";
import { getTrafficDataBetweenYears } from "./queries/data";
import { userIsLoggedIn } from "./queries/user";
import { Context } from "src/functions/graphql/context";

export default {
  hello: (_, __, { isAuth }: Context): string =>
    isAuth ? `Hello world!` : "Someone's been a bad boy ;)",
  getTrafficDataBetweenYears,
  userIsLoggedIn,
} as QueryResolvers;
