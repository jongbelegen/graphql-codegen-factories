"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactoriesSchemaVisitor = void 0;
const graphql_1 = require("graphql");
const visitor_plugin_common_1 = require("@graphql-codegen/visitor-plugin-common");
const FactoriesBaseVisitor_1 = require("../FactoriesBaseVisitor");
class FactoriesSchemaVisitor extends FactoriesBaseVisitor_1.FactoriesBaseVisitor {
    constructor(schema, config) {
        var _a;
        const parsedConfig = {
            enumsAsTypes: (0, visitor_plugin_common_1.getConfigValue)(config.enumsAsTypes, false),
            scalarDefaults: (0, visitor_plugin_common_1.getConfigValue)(config.scalarDefaults, {}),
            namespacedImportName: (0, visitor_plugin_common_1.getConfigValue)(config.namespacedImportName, undefined),
            typesPath: (0, visitor_plugin_common_1.getConfigValue)(config.typesPath, undefined),
            importTypesNamespace: (0, visitor_plugin_common_1.getConfigValue)(config.importTypesNamespace, undefined),
            inputMaybeValueDefault: (0, visitor_plugin_common_1.getConfigValue)(config.inputMaybeValueDefault, "null"),
        };
        if (parsedConfig.typesPath && parsedConfig.namespacedImportName == null) {
            parsedConfig.namespacedImportName =
                (_a = parsedConfig.importTypesNamespace) !== null && _a !== void 0 ? _a : "Types";
        }
        super(config, parsedConfig);
        this.enums = {};
        this.unions = {};
        this.interfaces = {};
        const initializeInterface = (name) => {
            if (this.interfaces[name] == null) {
                this.interfaces[name] = {
                    interface: null,
                    implementations: [],
                };
            }
        };
        Object.values(schema.getTypeMap()).forEach((type) => {
            if ((0, graphql_1.isEnumType)(type)) {
                this.enums[type.name] = type;
            }
            if ((0, graphql_1.isUnionType)(type)) {
                this.unions[type.name] = type;
            }
            if ((0, graphql_1.isInterfaceType)(type)) {
                initializeInterface(type.name);
                this.interfaces[type.name].interface = type;
            }
            if ((0, graphql_1.isObjectType)(type)) {
                type.getInterfaces().forEach((inter) => {
                    initializeInterface(inter.name);
                    this.interfaces[inter.name].implementations.push(type);
                });
            }
        });
    }
    getImports() {
        const imports = [];
        if (this.config.typesPath) {
            imports.push(`import * as ${this.config.namespacedImportName} from '${this.config.typesPath}';\n`);
        }
        return imports;
    }
    convertNameWithTypesNamespace(name) {
        var _a;
        return this.convertNameWithNamespace(name, (_a = this.config.namespacedImportName) !== null && _a !== void 0 ? _a : undefined);
    }
    convertObjectType(node) {
        var _a;
        return new visitor_plugin_common_1.DeclarationBlock(this._declarationBlockConfig)
            .export()
            .asKind("function")
            .withName(`${this.convertFactoryName(node)}(props: Partial<${this.convertNameWithTypesNamespace(node.name.value)}> = {}): ${this.convertNameWithTypesNamespace(node.name.value)}`)
            .withBlock([
            (0, visitor_plugin_common_1.indent)("return {"),
            node.kind === "ObjectTypeDefinition"
                ? (0, visitor_plugin_common_1.indent)((0, visitor_plugin_common_1.indent)(`__typename: "${node.name.value}",`))
                : null,
            ...((_a = node.fields) !== null && _a !== void 0 ? _a : []),
            (0, visitor_plugin_common_1.indent)((0, visitor_plugin_common_1.indent)("...props,")),
            (0, visitor_plugin_common_1.indent)("};"),
        ]
            .filter(Boolean)
            .join("\n")).string;
    }
    convertField(node, nullableDefaultValue) {
        const { defaultValue, isNullable } = node.type;
        return (0, visitor_plugin_common_1.indent)((0, visitor_plugin_common_1.indent)(`${node.name.value}: ${isNullable ? nullableDefaultValue : defaultValue},`));
    }
    getDefaultValue(nodeName) {
        const scalarName = nodeName in this.unions
            ? // Take the first type from an union
                this.unions[nodeName].getTypes()[0].name
            : nodeName in this.interfaces
                ? // Take the first implementation from an interface
                    this.interfaces[nodeName].implementations[0].name
                : nodeName;
        if (scalarName in this.config.scalarDefaults) {
            return this.config.scalarDefaults[scalarName];
        }
        switch (scalarName) {
            case "Int":
            case "Float":
                return "0";
            case "ID":
            case "String":
                return '""';
            case "Boolean":
                return "false";
            default: {
                if (scalarName in this.enums) {
                    return this.config.enumsAsTypes
                        ? `"${this.enums[scalarName].getValues()[0].value}"`
                        : `${this.convertNameWithTypesNamespace(scalarName)}.${this.convertName(this.enums[scalarName].getValues()[0].name, {
                            transformUnderscore: true,
                        })}`;
                }
                return `${this.convertFactoryName(scalarName)}({})`;
            }
        }
    }
    NamedType(node) {
        return {
            typename: node.name.value,
            defaultValue: this.getDefaultValue(node.name.value),
            isNullable: true,
        };
    }
    ListType(node) {
        return {
            typename: node.type.typename,
            defaultValue: "[]",
            isNullable: true,
        };
    }
    NonNullType(node) {
        return Object.assign(Object.assign({}, node.type), { isNullable: false });
    }
    FieldDefinition(node) {
        return this.convertField(node, "null");
    }
    InputObjectTypeDefinition(node) {
        return this.convertObjectType(node);
    }
    InputValueDefinition(node) {
        return this.convertField(node, this.config.inputMaybeValueDefault);
    }
    ObjectTypeDefinition(node) {
        return this.convertObjectType(node);
    }
    UnionTypeDefinition(node) {
        var _a;
        const types = (_a = node.types) !== null && _a !== void 0 ? _a : [];
        if (types.length <= 0) {
            // Creating an union that represents nothing is valid
            // So this is valid:
            // union Humanoid = Human | Droid
            // But this is also valid:
            // union Humanoid
            return undefined;
        }
        return new visitor_plugin_common_1.DeclarationBlock(this._declarationBlockConfig)
            .export()
            .asKind("function")
            .withName(`${this.convertFactoryName(node.name.value)}(props: Partial<${this.convertNameWithTypesNamespace(node.name.value)}> = {}): ${this.convertNameWithTypesNamespace(node.name.value)}`)
            .withBlock([
            (0, visitor_plugin_common_1.indent)("switch(props.__typename) {"),
            ...types.flatMap((type) => [
                (0, visitor_plugin_common_1.indent)((0, visitor_plugin_common_1.indent)(`case "${type.typename}":`)),
                (0, visitor_plugin_common_1.indent)((0, visitor_plugin_common_1.indent)((0, visitor_plugin_common_1.indent)(`return ${this.convertFactoryName(type.typename)}(props);`))),
            ]),
            (0, visitor_plugin_common_1.indent)((0, visitor_plugin_common_1.indent)(`case undefined:`)),
            (0, visitor_plugin_common_1.indent)((0, visitor_plugin_common_1.indent)(`default:`)),
            (0, visitor_plugin_common_1.indent)((0, visitor_plugin_common_1.indent)((0, visitor_plugin_common_1.indent)(`return ${this.convertFactoryName(node.name.value)}({ __typename: "${types[0].typename}", ...props });`))),
            (0, visitor_plugin_common_1.indent)("}"),
        ]
            .filter(Boolean)
            .join("\n")).string;
    }
}
exports.FactoriesSchemaVisitor = FactoriesSchemaVisitor;
