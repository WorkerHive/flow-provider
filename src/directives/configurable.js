import { SchemaDirectiveVisitor } from 'graphql-tools'
import { GraphQLSchema, GraphQLScalarType, GraphQLArgument, GraphQLField, GraphQLInterfaceType, GraphQLObjectType, GraphQLUnionType, GraphQLEnumType, GraphQLInputObjectType, GraphQLInputField } from 'graphql-compose/lib/graphql';
import { VisitableSchemaType } from 'graphql-tools/dist/schemaVisitor';

export default class ConfigurableDirective extends SchemaDirectiveVisitor{


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
