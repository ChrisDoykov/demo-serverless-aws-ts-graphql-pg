import { Config } from "jest";

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.spec.ts"],
  clearMocks: true,
  modulePaths: ["."],
} as Config;
