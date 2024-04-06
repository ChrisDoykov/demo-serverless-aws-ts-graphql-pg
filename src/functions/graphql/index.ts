import { handlerPath } from "../../libs";

const GENERIC_PATH = `${handlerPath(__dirname)}/apollo`;

export const graphql = {
  handler: `${GENERIC_PATH}.graphqlHandler`,
  events: [
    {
      http: {
        method: "post",
        path: "graphql",
      },
    },
  ],
};
