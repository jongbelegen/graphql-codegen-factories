"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const plugin_1 = require("../plugin");
describe("plugin", () => {
    it("should generate factory for a simple operation", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type User {
        id: ID!
        username: String!
      }

      type Mutation {
        createUser(username: String): User!
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      mutation CreateUser($username: String) {
        createUser(username: $username) {
          id
          username
        }
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "CreateUser.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should support aliases", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type User {
        id: ID!
        username: String!
      }

      type Mutation {
        createUser(username: String): User!
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      mutation CreateUser($username: String) {
        createUser(username: $username) {
          id
          email: username
        }
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "CreateUser.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should support fragments", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type User {
        id: ID!
        username: String!
      }

      type Query {
        me: User!
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query GetMe {
        me {
          ...UserFragment
        }
      }
      fragment UserFragment on User {
        id
        username
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetMe.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should merge fragments with the same type condition", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type User {
        id: ID!
        username: String!
      }

      type Query {
        me: User!
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query GetMe {
        me {
          ...UserIDFragment
          ...UserUsernameFragment
        }
      }
      fragment UserIDFragment on User {
        id
      }
      fragment UserUsernameFragment on User {
        username
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetMe.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should support inline fragments", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type User {
        id: ID!
        username: String!
      }

      type Query {
        me: User!
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query GetMe {
        me {
          ... on User {
            id
            username
          }
        }
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetMe.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should merge inline fragments with the same type condition", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type User {
        id: ID!
        username: String!
      }

      type Query {
        me: User!
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query GetMe {
        me {
          ... on User {
            id
          }
          ... on User {
            username
          }
        }
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetMe.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should unwrap inline fragments without a type condition", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type User {
        id: ID!
        username: String!
      }

      type Query {
        me: User!
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query GetMe {
        me {
          ... {
            id
            ... {
              username
            }
          }
        }
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetMe.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should merge fragments and inline fragments with the same type condition", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type User {
        id: ID!
        username: String!
      }

      type Query {
        me: User!
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query GetMe {
        me {
          ... on User {
            id
          }
          ...UserUsernameFragment
        }
      }
      fragment UserUsernameFragment on User {
        username
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetMe.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should support external fragments", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type User {
        id: ID!
        username: String!
      }

      type Query {
        me: User!
      }
    `);
        const fragments = (0, graphql_1.parse)(/* GraphQL */ `
      fragment UserFragment on User {
        id
        username
      }
    `);
        const allFragments = fragments.definitions.filter((d) => d.kind === graphql_1.Kind.FRAGMENT_DEFINITION);
        const externalFragments = allFragments.map((frag) => ({
            isExternal: true,
            importFrom: frag.name.value,
            name: frag.name.value,
            onType: frag.typeCondition.name.value,
            node: frag,
        }));
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query GetMe {
        me {
          ...UserFragment
        }
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetMe.graphql", document: ast }], {
            schemaFactoriesPath: "./factories",
            externalFragments,
        });
        expect(output).toMatchSnapshot();
    }));
    it("should support unnamed operations", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type User {
        id: ID!
        username: String!
      }

      type Query {
        me: User
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query {
        me {
          id
          username
        }
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetMe.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should support lists", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type User {
        id: ID!
        username: String!
      }

      type Query {
        users: [User!]!
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query GetUsers {
        users {
          id
          username
        }
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetUsers.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should support nested selections", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type User {
        id: ID!
        username: String!
        followers: [User]
      }

      type Query {
        me: User
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query GetMe {
        me {
          id
          username
          followers {
            id
          }
        }
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetMe.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should support unions", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type ImageDimensions {
        width: Int!
        height: Int!
      }

      type Image {
        src: String!
        dimensions: ImageDimensions
      }

      type Video {
        href: String!
        dimensions: ImageDimensions
      }

      union Media = Image | Video

      type Query {
        medias: [Media!]!
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query GetMedias {
        medias {
          ... on Image {
            src
            dimensions {
              width
            }
          }
          ... on Video {
            href
            dimensions {
              height
            }
          }
        }
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetMedias.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should add interface's selections to the matching types", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      interface File {
        path: String!
      }

      type Image implements File {
        path: String!
        width: Int!
        height: Int!
      }

      type Audio implements File {
        path: String!
        length: Int!
      }

      interface Streamable {
        url: String!
      }

      type Video implements Streamable {
        url: String!
        length: Int!
      }

      union Media = Image | Audio | Video

      type Query {
        medias: [Media!]!
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query GetMedias {
        medias {
          ... on File {
            path
          }
          ... on Streamable {
            url
          }
          ... on Image {
            width
          }
          ... on Audio {
            length
          }
          ... on Video {
            length
          }
        }
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetMedias.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should dedupe fields", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      interface Node {
        id: ID!
      }

      type User implements Node {
        id: ID!
        username: String!
      }

      type Admin implements Node {
        id: ID!
        canDeleteUser: Boolean!
      }

      union Me = User | Admin

      type Query {
        me: Me
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query GetMe {
        me {
          ... on Node {
            id
          }
          ... on User {
            ...UserFragment
            id
            userId: id
            username
          }
          ... on Admin {
            id
          }
        }
      }
      fragment UserFragment on User {
        id
        username
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetMe.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
    it("should generate union factory even when querying one type from the union", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      type Image {
        width: Int!
        height: Int!
      }

      type Audio {
        length: Int!
      }

      union Media = Image | Audio

      type Query {
        medias: [Media!]!
      }
    `);
        const ast = (0, graphql_1.parse)(/* GraphQL */ `
      query GetMedias {
        medias {
          ... on Audio {
            length
          }
        }
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [{ location: "GetMedias.graphql", document: ast }], { schemaFactoriesPath: "./factories" });
        expect(output).toMatchSnapshot();
    }));
});
