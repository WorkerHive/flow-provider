const { SchemaDirectiveVisitor } = require("apollo-server");

class InputDirective extends SchemaDirectiveVisitor{
    visitFieldDefinition(field){
    }


    visitSchema(schema){
    }

    visitFieldDefinition(fd, details){
        fd.isInput = true;
    }

    visitEnumValue(value){
    }
}

module.exports = InputDirective