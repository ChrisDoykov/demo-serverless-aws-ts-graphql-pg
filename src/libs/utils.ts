import { Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken"; // For generating JWTs
import { equals, includes, isNil, not, prop, propOr } from "ramda";

import DatabaseConnector from "src/database";

export const env = (key: string): string | null =>
  process.env[key] ? process.env[key].trim() : null;

export const getTokenPayload = (token: string): string | JwtPayload =>
  jwt.verify(token, env("APP_SECRET"));

export const setSessionCookie = (res: Response, sessionCookie: string) => {
  // Add token as a cookie
  res.cookie("sessionToken", sessionCookie, {
    httpOnly: true,
    secure: true,
    // Disabling so this API can be used with other demos
    // sameSite: not(isLocalhost),
    sameSite: "none",
    maxAge: 60 * 60 * 1000, // 1 hour
  });
};

export const generateSessionCookie = (userId: number): string =>
  jwt.sign({ userId }, env("APP_SECRET"), { expiresIn: "1h" });

export const tokenIsValid = async (
  cookie: string,
  db: DatabaseConnector
): Promise<boolean> => {
  try {
    const tokenPair = cookie
      .split("; ")
      .find((pair) => includes("sessionToken", pair));

    let userId: string;
    try {
      const tokenPayload = getTokenPayload(
        tokenPair?.replace("sessionToken=", "")
      );

      userId = propOr("", "userId", tokenPayload);
    } catch (error) {
      // Invalid token
      console.error("[ Auth Middleware ] Incoming token invalid error", error);
      return false;
    }

    if (userId) {
      const user = await db.User.findOne({
        where: {
          id: userId,
        },
      });

      // User is not found in our db
      return not(isNil(prop("id", user.dataValues)));
    }

    return false;
  } catch (error) {
    console.error("[ tokenIsValid ] Internal server error", error);
    return false;
  }
};

export const isTest = equals(env("NODE_ENV"), "test");
export const isLocalhost = equals(env("NODE_ENV"), "localhost");
