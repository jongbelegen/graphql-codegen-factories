"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactoriesBaseVisitor = void 0;
const visitor_plugin_common_1 = require("@graphql-codegen/visitor-plugin-common");
class FactoriesBaseVisitor extends visitor_plugin_common_1.BaseVisitor {
    constructor(config, parsedConfig) {
        super(config, Object.assign(Object.assign({}, parsedConfig), { factoryName: (0, visitor_plugin_common_1.getConfigValue)(config.factoryName, "create{Type}Mock") }));
    }
    convertFactoryName(...args) {
        return this.config.factoryName.replace("{Type}", this.convertName(...args));
    }
    convertNameWithNamespace(name, namespace) {
        const convertedName = this.convertName(name);
        return namespace ? `${namespace}.${convertedName}` : convertedName;
    }
    print(lines, count = 0) {
        return lines
            .map((line) => {
            if (Array.isArray(line)) {
                return this.print(line, count + 1);
            }
            return (0, visitor_plugin_common_1.indent)(line, count);
        })
            .join("\n");
    }
}
exports.FactoriesBaseVisitor = FactoriesBaseVisitor;
