const { SchemaDirectiveVisitor } = require("apollo-server");

class ConfigurableDirective extends SchemaDirectiveVisitor{
    visitFieldDefinition(field){
        console.log(field)
    }

    visitObject(object){
        object.isConfigurable = true;
    }

    visitSchema(schema){
        console.log(schema)
    }

    visitFieldDefinition(fd, details){
        fd.isConfigurable = true;
        details.objectType.isConfigurable = true;
    }

    visitEnumValue(value){
        console.log(value)
    }
}

module.exports = ConfigurableDirective