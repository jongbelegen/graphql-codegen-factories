"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactoriesOperationsVisitor = void 0;
const path_1 = __importDefault(require("path"));
const plugin_helpers_1 = require("@graphql-codegen/plugin-helpers");
const visitor_plugin_common_1 = require("@graphql-codegen/visitor-plugin-common");
const change_case_all_1 = require("change-case-all");
const graphql_1 = require("graphql");
const FactoriesBaseVisitor_1 = require("../FactoriesBaseVisitor");
class FactoriesOperationsVisitor extends FactoriesBaseVisitor_1.FactoriesBaseVisitor {
    constructor(schema, fragments, config, outputFile) {
        const parsedConfig = {
            schemaFactoriesPath: (0, visitor_plugin_common_1.getConfigValue)(config.schemaFactoriesPath, undefined),
            namespacedSchemaFactoriesImportName: (0, visitor_plugin_common_1.getConfigValue)(config.namespacedSchemaFactoriesImportName, undefined),
        };
        if (parsedConfig.schemaFactoriesPath && outputFile) {
            const outputDirectory = path_1.default.dirname(outputFile);
            const schemaFactoriesPath = path_1.default.resolve(process.cwd(), parsedConfig.schemaFactoriesPath);
            const relativeFactoriesPath = path_1.default.relative(outputDirectory, schemaFactoriesPath);
            // If the factories are located in the same directory as the file,
            // the path will look like "generated/factories.ts"  instead of "./generated/factories.ts".
            // So we need to add the ./ at the beginning in this case.
            parsedConfig.schemaFactoriesPath = relativeFactoriesPath.startsWith(".")
                ? relativeFactoriesPath
                : `./${relativeFactoriesPath}`;
        }
        if (parsedConfig.schemaFactoriesPath &&
            parsedConfig.namespacedSchemaFactoriesImportName == null) {
            parsedConfig.namespacedSchemaFactoriesImportName = "schemaFactories";
        }
        super(config, parsedConfig);
        this.unnamedCounter = 1;
        this.schema = schema;
        this.fragments = fragments;
    }
    convertNameWithFactoriesNamespace(name) {
        return this.config.namespacedSchemaFactoriesImportName
            ? `${this.config.namespacedSchemaFactoriesImportName}.${name}`
            : name;
    }
    handleAnonymousOperation(node) {
        const name = node.name && node.name.value;
        if (name) {
            return this.convertName(name, {
                useTypesPrefix: false,
                useTypesSuffix: false,
            });
        }
        return this.convertName(String(this.unnamedCounter++), {
            prefix: "Unnamed_",
            suffix: "_",
            useTypesPrefix: false,
            useTypesSuffix: false,
        });
    }
    getImports() {
        const imports = [];
        if (this.config.schemaFactoriesPath) {
            imports.push(`import * as ${this.config.namespacedSchemaFactoriesImportName} from "${this.config.schemaFactoriesPath.replace(/\.(js|ts|d.ts)$/, "")}";`);
        }
        return imports;
    }
    groupSelections(selections) {
        return selections
            .filter((selection, index, selections) => selections.findIndex((otherSelection) => otherSelection.alias === selection.alias &&
            otherSelection.name === selection.name &&
            otherSelection.typeCondition.name === selection.typeCondition.name) === index)
            .reduce((acc, selection) => {
            var _a;
            acc[selection.typeCondition.name] = ((_a = acc[selection.typeCondition.name]) !== null && _a !== void 0 ? _a : []).concat(selection);
            return acc;
        }, {});
    }
    normalizeSelection(parent, selection) {
        var _a;
        if (selection.kind === graphql_1.Kind.OPERATION_DEFINITION) {
            const operationSuffix = this.getOperationSuffix(selection, parent.name);
            const name = this.convertName(this.handleAnonymousOperation(selection), {
                suffix: operationSuffix,
            });
            return [
                {
                    name: name,
                    alias: this.convertFactoryName(name),
                    typeCondition: parent,
                    type: parent,
                    selections: this.groupSelections(selection.selectionSet.selections.flatMap((selection) => this.normalizeSelection(parent, selection))),
                },
            ];
        }
        if (selection.kind === graphql_1.Kind.FIELD) {
            const type = parent.getFields()[selection.name.value].type;
            return [
                {
                    name: selection.name.value,
                    alias: (_a = selection.alias) === null || _a === void 0 ? void 0 : _a.value,
                    typeCondition: parent,
                    type: type,
                    selections: selection.selectionSet == null
                        ? undefined
                        : this.groupSelections(selection.selectionSet.selections.flatMap((childSelection) => this.normalizeSelection((0, plugin_helpers_1.getBaseType)(type), childSelection))),
                },
            ];
        }
        let typeCondition = parent;
        let selections = [];
        if (selection.kind === graphql_1.Kind.FRAGMENT_SPREAD) {
            const fragment = this.fragments.find((otherFragment) => otherFragment.name.value === selection.name.value);
            if (fragment == null) {
                throw new Error(`Fragment "${selection.name.value}" not found`);
            }
            const newTypeCondition = this.schema.getType(fragment.typeCondition.name.value);
            if (newTypeCondition == null) {
                throw new Error(`Fragment "${fragment.name.value}"'s type condition "${fragment.typeCondition.name.value}" not found`);
            }
            typeCondition = newTypeCondition;
            selections = fragment.selectionSet.selections;
        }
        if (selection.kind === graphql_1.Kind.INLINE_FRAGMENT) {
            if (selection.typeCondition) {
                const newTypeCondition = this.schema.getType(selection.typeCondition.name.value);
                if (newTypeCondition == null) {
                    throw new Error(`Inline fragment's type condition "${selection.typeCondition.name.value}" not found`);
                }
                typeCondition = newTypeCondition;
            }
            selections = selection.selectionSet.selections;
        }
        let typeConditions = [typeCondition];
        if ((0, graphql_1.isInterfaceType)(typeCondition)) {
            typeConditions = (0, graphql_1.isUnionType)(parent)
                ? parent
                    .getTypes()
                    .filter((type) => type
                    .getInterfaces()
                    .some((inter) => inter.name === typeCondition.name))
                : [parent];
        }
        return typeConditions.flatMap((otherTypeCondition) => selections.flatMap((childSelection) => this.normalizeSelection(otherTypeCondition, childSelection)));
    }
    convertOperationFactoryName(ancestors) {
        return ancestors
            .flatMap(({ selection, typeCondition }) => {
            var _a;
            return [
                (_a = selection.alias) !== null && _a !== void 0 ? _a : selection.name,
                ...((0, graphql_1.isUnionType)((0, plugin_helpers_1.getBaseType)(selection.type)) && typeCondition
                    ? [typeCondition]
                    : []),
            ];
        })
            .join("_");
    }
    wrapWithModifiers(returnType, type, isNullable = true) {
        if ((0, graphql_1.isNonNullType)(type)) {
            return this.wrapWithModifiers(returnType, type.ofType, false);
        }
        const updatedReturnType = isNullable
            ? `NonNullable<${returnType}>`
            : returnType;
        if ((0, graphql_1.isListType)(type)) {
            return this.wrapWithModifiers(`${updatedReturnType}[number]`, type.ofType);
        }
        return updatedReturnType;
    }
    getReturnType([{ selection: operation }, ...selections]) {
        return selections.reduce((acc, { selection, typeCondition }) => {
            const withModifiers = this.wrapWithModifiers(`${acc}["${selection.name}"]`, selection.type);
            return (0, graphql_1.isUnionType)((0, plugin_helpers_1.getBaseType)(selection.type)) && typeCondition
                ? `Extract<${withModifiers} & { __typename: "${typeCondition}" }, { __typename: "${typeCondition}" }>`
                : withModifiers;
        }, operation.name);
    }
    generateFactories(selection, ancestors = []) {
        if (selection.selections == null) {
            return [];
        }
        const factories = [];
        if ((0, graphql_1.isUnionType)((0, plugin_helpers_1.getBaseType)(selection.type))) {
            const futureAncestors = ancestors.concat({
                selection,
                typeCondition: undefined,
            });
            const factoryName = this.convertOperationFactoryName(futureAncestors);
            const returnType = this.getReturnType(futureAncestors);
            const typeConditions = Object.keys(selection.selections);
            const defaultTypeCondition = typeConditions[0];
            factories.push(this.print([
                `export function ${factoryName}(props: Partial<${returnType}> = {}): ${returnType} {`,
                [
                    `switch(props.__typename) {`,
                    ...typeConditions.map((typeCondition) => [
                        `case "${typeCondition}":`,
                        [
                            `return ${this.convertOperationFactoryName(ancestors.concat({ selection, typeCondition }))}(props);`,
                        ],
                    ]),
                    [
                        `case undefined:`,
                        `default:`,
                        [
                            `return ${factoryName}({ ...props, __typename: "${defaultTypeCondition}" })`,
                        ],
                    ],
                    `}`,
                ],
                `}`,
            ]));
        }
        Object.entries(selection.selections).forEach(([typeCondition, childSelections]) => {
            const futureAncestors = ancestors.concat({ selection, typeCondition });
            const factoryName = this.convertOperationFactoryName(futureAncestors);
            const returnType = this.getReturnType(futureAncestors);
            const objectVarName = (0, change_case_all_1.camelCase)(typeCondition);
            const scalars = childSelections.filter((childSelection) => childSelection.selections == null);
            factories.push(this.print([
                `export function ${factoryName}(props: Partial<${returnType}> = {}): ${returnType} {`,
                [
                    ...(scalars.length > 0
                        ? [
                            `const ${objectVarName} = ${this.convertNameWithFactoriesNamespace(this.convertFactoryName(typeCondition))}({`,
                            scalars.map((scalar) => { var _a; return `${scalar.name}: props.${(_a = scalar.alias) !== null && _a !== void 0 ? _a : scalar.name},`; }),
                            `});`,
                        ]
                        : []),
                    `return {`,
                    [
                        `__typename: "${typeCondition}",`,
                        ...childSelections.map((childSelection) => {
                            var _a;
                            let value = `${objectVarName}.${childSelection.name}`;
                            if (childSelection.selections) {
                                if ((0, graphql_1.isNonNullType)(childSelection.type)) {
                                    value = (0, graphql_1.isListType)(childSelection.type.ofType)
                                        ? "[]"
                                        : `${this.convertOperationFactoryName(futureAncestors.concat({
                                            selection: childSelection,
                                            typeCondition,
                                        }))}({})`;
                                }
                                else {
                                    value = "null";
                                }
                            }
                            return `${(_a = childSelection.alias) !== null && _a !== void 0 ? _a : childSelection.name}: ${value},`;
                        }),
                        `...props,`,
                    ],
                    `};`,
                ],
                `}`,
            ]));
            childSelections.forEach((childSelection) => {
                if (childSelection.selections) {
                    factories.push(...this.generateFactories(childSelection, futureAncestors));
                }
            });
        });
        return factories;
    }
    OperationDefinition(node) {
        const rootType = this.schema.getRootType(node.operation);
        if (rootType == null) {
            throw new Error(`Root type "${node.operation}" not found`);
        }
        return this.normalizeSelection(rootType, node)
            .flatMap((selection) => this.generateFactories(selection))
            .join("\n\n");
    }
}
exports.FactoriesOperationsVisitor = FactoriesOperationsVisitor;
