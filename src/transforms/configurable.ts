import { Transform, mergeSchemas, gql } from 'apollo-server'
import { getDirectives, mapSchema, MapperKind }  from '@graphql-tools/utils'
import { isNativeGraphQLType }  from './native-symbols'
import { objectValues, compact }  from './utils'
import { GraphQLSchema, GraphQLObjectType, isListType, isNonNullType, GraphQLType, GraphQLList, GraphQLNonNull, GraphQLNamedType, GraphQLString, GraphQLArgument, GraphQLFieldConfigArgumentMap, GraphQLDirective, GraphQLDirectiveConfig, GraphQLInputObjectType } from 'graphql'
import { SchemaComposer } from 'graphql-compose'

let typeMap;

  
export default function configurableTransformer (){
    return {
        configurableTypeDefs: `directive @configurable on OBJECT | FIELD_DEFINITION `,
        configurableTransformer: (schema : SchemaComposer<any>) => {

            //console.log(schema._typeMap)

            return schema
        }
    }
}
