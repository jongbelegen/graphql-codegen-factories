"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const graphql_1 = require("graphql");
const plugin_helpers_1 = require("@graphql-codegen/plugin-helpers");
const FactoriesOperationsVisitor_1 = require("./FactoriesOperationsVisitor");
const plugin = (schema, documents, config, info) => {
    const allAst = (0, graphql_1.concatAST)(documents.map(({ document }) => document));
    const fragments = allAst.definitions.filter((d) => d.kind === graphql_1.Kind.FRAGMENT_DEFINITION);
    const allFragments = [
        ...fragments,
        // `externalFragments` config is passed by the near-operation-file preset.
        // It is an array of fragments declared outside of the operation file.
        ...(config.externalFragments || []).map(({ node }) => node),
    ];
    const visitor = new FactoriesOperationsVisitor_1.FactoriesOperationsVisitor(schema, allFragments, config, info === null || info === void 0 ? void 0 : info.outputFile);
    const content = (0, plugin_helpers_1.oldVisit)(allAst, { leave: visitor }).definitions
        .filter((definition) => typeof definition === "string")
        .join("\n");
    return {
        prepend: visitor.getImports(),
        content,
    };
};
exports.plugin = plugin;
