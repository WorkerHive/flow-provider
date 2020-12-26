const { SchemaDirectiveVisitor } = require("apollo-server");

class CRUDDirective extends SchemaDirectiveVisitor{
    visitFieldDefinition(field){
        console.log(field)
    }

    visitObject(object){
        console.log(object.getFields())
        object.automateCRUD = true;
    }

    visitSchema(schema){
        console.log(schema)
    }

    visitFieldDefinition(fd, details){
        console.log(fd)
        fd.isConfigurable = true;
        details.objectType.isConfigurable = true;
    }

    visitEnumValue(value){
        console.log(value)
    }
}

module.exports = CRUDDirective