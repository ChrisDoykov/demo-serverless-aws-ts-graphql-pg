import { equals, not } from "ramda";
import { env } from "src/libs";

export const ORIGIN_WHITELIST: string[] =
  env("ALLOWED_ORIGINS") && not(equals(env("ALLOWED_ORIGINS"), "*"))
    ? env("ALLOWED_ORIGINS").split(",")
    : [];
