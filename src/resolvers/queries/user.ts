import { Context } from "src/functions/graphql/context";

/* Simply return the outcome of the isAuth middleware */
export const userIsLoggedIn = (_, __, { isAuth }: Context): boolean => isAuth;
