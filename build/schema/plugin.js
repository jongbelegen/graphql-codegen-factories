"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const graphql_1 = require("graphql");
const plugin_helpers_1 = require("@graphql-codegen/plugin-helpers");
const FactoriesSchemaVisitor_1 = require("./FactoriesSchemaVisitor");
const plugin = (schema, documents, config) => {
    const printedSchema = (0, graphql_1.printSchema)(schema);
    const astNode = (0, graphql_1.parse)(printedSchema);
    const visitor = new FactoriesSchemaVisitor_1.FactoriesSchemaVisitor(schema, config);
    const content = (0, plugin_helpers_1.oldVisit)(astNode, { leave: visitor }).definitions
        .filter((definition) => typeof definition === "string")
        .join("\n");
    return {
        prepend: visitor.getImports(),
        content,
    };
};
exports.plugin = plugin;
