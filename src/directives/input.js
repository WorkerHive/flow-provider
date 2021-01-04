import { SchemaDirectiveVisitor } from "apollo-server"
import { GraphQLSchema, GraphQLScalarType, GraphQLObjectType, GraphQLArgument, GraphQLField, GraphQLInterfaceType, GraphQLUnionType, GraphQLEnumType, GraphQLInputObjectType, GraphQLInputField } from "graphql-compose/lib/graphql";
import { VisitableSchemaType } from "graphql-tools/dist/schemaVisitor";

export default class InputDirective extends SchemaDirectiveVisitor{
    
    visitSchema(schema){
    }

    visitFieldDefinition(fd, details){
        fd.isInput = true;
    }

    visitEnumValue(value){
    }
}