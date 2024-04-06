import { GraphQLError } from "graphql";

import bcrypt from "bcryptjs";
import { not, prop } from "ramda";

import { generateSessionCookie, setSessionCookie } from "src/libs";
import { Context } from "src/functions/graphql/context";
import {
  MutationLoginArgs,
  MutationRegisterArgs,
  User,
} from "src/generated/graphql";

export async function register(
  _,
  { name, email, password }: MutationRegisterArgs,
  { res, db, isAuth, testing = false }: Context
): Promise<User | boolean | null> {
  if (isAuth) return null;

  try {
    const hashedPass = await bcrypt.hash(password, 8);
    const user = await db.User.create({
      name,
      email,
      password: hashedPass,
    });

    // Create token for the user
    const sessionCookieToken = generateSessionCookie(user?.dataValues?.id);

    // Add token as a cookie
    if (not(testing)) setSessionCookie(res, sessionCookieToken);

    return user.dataValues;
  } catch (error) {
    console.error("Failed to register user: ", error);
    throw new GraphQLError(
      `Failed to register! (${prop("message", error) || error})`,
      {
        extensions: { code: "REG_FAIL" },
      }
    );
  }
}

export async function login(
  _,
  { email, password }: MutationLoginArgs,
  { res, db, isAuth, testing = false }: Context
): Promise<User | boolean | null> {
  if (isAuth) return null;

  // Lookup user by email
  const userFromEmail = await db.User.findOne({
    where: {
      email,
    },
  });

  if (!userFromEmail)
    throw new GraphQLError("Failed to find user.", {
      extensions: { code: "NO_USER" },
    });

  const valid = await bcrypt.compare(
    password,
    userFromEmail?.dataValues?.password
  );

  if (!valid)
    throw new GraphQLError("Incorrect password!", {
      extensions: { code: "WRONG_PASS" },
    });

  // Create token for the user
  const sessionCookieToken = generateSessionCookie(
    userFromEmail?.dataValues?.id
  );

  // Add token as a cookie
  if (not(testing)) setSessionCookie(res, sessionCookieToken);

  return userFromEmail.dataValues;
}

export async function logout(_, __, { res }: Context): Promise<boolean> {
  res.clearCookie("sessionToken");
  return true;
}
