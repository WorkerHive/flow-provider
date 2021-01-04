import { SchemaDirectiveVisitor } from "apollo-server"
import { GraphQLSchema, GraphQLScalarType, GraphQLArgument, GraphQLField, GraphQLInterfaceType, GraphQLObjectType, GraphQLUnionType, GraphQLEnumType, GraphQLInputObjectType, GraphQLInputField } from "graphql-compose/lib/graphql";
import { VisitableSchemaType } from "graphql-tools/dist/schemaVisitor";

export default class CRUDDirective extends SchemaDirectiveVisitor{
    

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
