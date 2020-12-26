const { SchemaDirectiveVisitor } = require("apollo-server");

class ConfigurableDirective extends SchemaDirectiveVisitor{
    visitFieldDefinition(field){
    }

    visitObject(object){
        object.isConfigurable = true;
    }

    visitSchema(schema){
    }

    visitFieldDefinition(fd, details){
        fd.isConfigurable = true;
        details.objectType.isConfigurable = true;
    }

    visitEnumValue(value){
    }
}

module.exports = ConfigurableDirective