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
    it("should create factories with built-in types", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(`
      type User {
        id: ID!
        organizationId: ID
        email: String!
        name: String
        age: Int!
        followers: Int
        geo: Geo!
        isUser: Boolean!
        isAdmin: Boolean
        status: UserStatus!
        favouriteFruit: Fruit
        posts: [Post!]!
        subscribers: [User!]
      }

      type Geo {
        lat: Float!
        lon: Float
      }

      type Post {
        id: ID!
      }

      enum UserStatus {
        Activated
        Created
      }

      enum Fruit {
        Pineapple
        Mango
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [], {});
        expect(output).toMatchSnapshot();
    }));
    it("should use enums as types", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(`
      type User {
        status: UserStatus!
      }

      enum UserStatus {
        Activated
        Created
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [], { enumsAsTypes: true });
        expect(output).toMatchSnapshot();
    }));
    it("should use the custom scalar defaults", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(`
      type User {
        createdAt: Date!
      }

      scalar Date
    `);
        const output = yield (0, plugin_1.plugin)(schema, [], {
            scalarDefaults: { Date: "new Date()" },
        });
        expect(output).toMatchSnapshot();
    }));
    it("should create factories for inputs", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(`
      input PostInput {
        id: ID
        title: String!
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [], {});
        expect(output).toMatchSnapshot();
    }));
    it("should create factories for Query and Mutation", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(`
      type User {
        id: ID!
      }

      type Query {
        users: [User!]!
      }

      type Mutation {
        createUser(id: ID!): User!
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [], {});
        expect(output).toMatchSnapshot();
    }));
    it("should customize the factory name", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(`
      type User {
        id: ID!
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [], { factoryName: "new{Type}" });
        expect(output).toMatchSnapshot();
    }));
    it("should customize the input maybe value default", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(`
      input PostInput {
        title: String
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [], {
            inputMaybeValueDefault: "undefined",
        });
        expect(output).toMatchSnapshot();
    }));
    it("should support enums with an underscore", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(`
      enum UserRole {
        SUPER_ADMIN
        ADMIN
      }
      type User {
        role: UserRole!
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [], {});
        expect(output).toMatchSnapshot();
    }));
    it("should support directives", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(`
      directive @test on FIELD_DEFINITION

      type User {
        id: String
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [], {});
        expect(output).toMatchSnapshot();
    }));
    it("should import types from other file", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(`
      type User {
        id: ID!
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [], {
            typesPath: "./types.ts",
            importTypesNamespace: "SharedTypes",
        });
        expect(output).toMatchSnapshot();
    }));
    it("should create factories for unions", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(`
      type User {
        firstName: String!
        lastName: String!
      }

      type Droid {
        codeName: String!
      }

      union Humanoid = User | Droid
    `);
        const output = yield (0, plugin_1.plugin)(schema, [], {});
        expect(output).toMatchSnapshot();
    }));
    it("should support interfaces", () => __awaiter(void 0, void 0, void 0, function* () {
        const schema = (0, graphql_1.buildSchema)(/* GraphQL */ `
      interface Node {
        id: ID!
      }
      type User implements Node {
        id: ID!
        username: String!
      }
    `);
        const output = yield (0, plugin_1.plugin)(schema, [], {});
        expect(output).toMatchSnapshot();
    }));
});
