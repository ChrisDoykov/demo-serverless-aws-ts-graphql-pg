import Query from "./Query";
import Mutation from "./Mutation";
import { MutationResolvers, QueryResolvers } from "src/generated/graphql";

export default {
  Query,
  Mutation,
} as QueryResolvers & MutationResolvers;
