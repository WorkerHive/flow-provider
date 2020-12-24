const { SchemaDirectiveVisitor } = require("apollo-server");

class InputDirective extends SchemaDirectiveVisitor{
    visitFieldDefinition(field){
        console.log(field)
    }


    visitSchema(schema){
        console.log(schema)
    }

    visitFieldDefinition(fd, details){
        fd.isInput = true;
        console.log(details)
    }

    visitEnumValue(value){
        console.log(value)
    }
}

module.exports = InputDirective