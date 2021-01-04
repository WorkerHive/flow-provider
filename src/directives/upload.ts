import { SchemaDirectiveVisitor } from "apollo-server"
import { GraphQLSchema, GraphQLScalarType, GraphQLArgument, GraphQLField, GraphQLInterfaceType, GraphQLObjectType, GraphQLUnionType, GraphQLEnumType, GraphQLInputObjectType, GraphQLInputField } from "graphql-compose/lib/graphql";
import { VisitableSchemaType } from "graphql-tools/dist/schemaVisitor";

export default class CRUDDirective implements SchemaDirectiveVisitor{
    name: string;
    args: { [name: string]: any; };
    visitedType: VisitableSchemaType;
    context: { [key: string]: any; };
    schema: GraphQLSchema;
    visitScalar(scalar: GraphQLScalarType): void | GraphQLScalarType {
        throw new Error("Method not implemented.");
    }
    visitArgumentDefinition(argument: GraphQLArgument, details: { field: GraphQLField<any, any, { [key: string]: any; }>; objectType: GraphQLInterfaceType | GraphQLObjectType<any, any>; }): void | GraphQLArgument {
        throw new Error("Method not implemented.");
    }
    visitInterface(iface: GraphQLInterfaceType): void | GraphQLInterfaceType {
        throw new Error("Method not implemented.");
    }
    visitUnion(union: GraphQLUnionType): void | GraphQLUnionType {
        throw new Error("Method not implemented.");
    }
    visitEnum(type: GraphQLEnumType): void | GraphQLEnumType {
        throw new Error("Method not implemented.");
    }
    visitInputObject(object: GraphQLInputObjectType): void | GraphQLInputObjectType {
        throw new Error("Method not implemented.");
    }
    visitInputFieldDefinition(field: GraphQLInputField, details: { objectType: GraphQLInputObjectType; }): void | GraphQLInputField {
        throw new Error("Method not implemented.");
    }

    visitObject(object){
        console.log(object.getFields())
        object.uploadTo = true;
    }

    visitSchema(schema){
        console.log(schema)
    }

    visitFieldDefinition(fd, details){
        console.log(fd)
        //fd.isConfigurable = true;
        //details.objectType.isConfigurable = true;
    }

    visitEnumValue(value){
        console.log(value)
    }
}

