import { MutationResolvers } from "src/generated/graphql";
import { register, login, logout } from "./mutations/user";

export default {
  login,
  logout,
  register,
} as MutationResolvers;
