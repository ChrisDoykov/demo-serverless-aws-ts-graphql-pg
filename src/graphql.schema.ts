export default `scalar DateTime
scalar JSON

type User {
  id: Int!
  name: String!
  email: String!
  createdAt: DateTime
  updatedAt: DateTime
}

type Record {
  id: Int!
  key: String!
  data: JSON
  updatedAt: DateTime!
  createdAt: DateTime!
}

type Query {
  hello: String!
  getTrafficDataBetweenYears(fromYear: Int, toYear: Int): Record
  userIsLoggedIn: Boolean!
}

type Mutation {
  register(name: String!, email: String!, password: String!): User
  login(email: String!, password: String!): User
  logout: Boolean!
}` as string;
