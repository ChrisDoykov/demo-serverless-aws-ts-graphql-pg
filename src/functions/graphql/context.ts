import express from "express";

import { HeaderMap } from "@apollo/server";
import { getCurrentInvoke } from "@codegenie/serverless-express/src/current-invoke";

import * as requestIp from "request-ip";

import { isTest, tokenIsValid } from "src/libs";
import DatabaseConnector from "src/database";

export type Context = {
  isAuth: boolean;
  db: DatabaseConnector;
  res: express.Response;
  req: express.Request;
  testing: boolean;
  headers: HeaderMap;
  ip: string;
};

type ContextGeneratorParams = {
  req: express.Request;
  res: express.Response;
};

export const generateContext = async (
  params: ContextGeneratorParams
): Promise<Context> => {
  const { req, res } = params;

  // Here is where you'll have access to the
  // API Gateway event and Lambda Context
  const { event } = getCurrentInvoke();

  // Parse the incoming headers
  const headers = new HeaderMap();
  for (const [key, value] of Object.entries(event.headers)) {
    headers.set(key, value as string);
  }

  // Initialize the db connection
  const db: DatabaseConnector = await DatabaseConnector.getInstance();

  // Parse incoming auth cookies
  const cookie = headers.get("cookie");
  const isAuth: boolean = cookie ? await tokenIsValid(cookie, db) : false;

  // Client IP is used primarily for rate limiting
  const clientIp = requestIp.getClientIp(req);

  return {
    req,
    res,
    db,
    isAuth,
    testing: isTest,
    ip: clientIp,
    headers,
  };
};
