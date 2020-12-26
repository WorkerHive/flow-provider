const { Transform, mergeSchemas, gql } = require('apollo-server')
const { getDirectives, mapSchema, MapperKind } = require('@graphql-tools/utils')
const { isNativeGraphQLType } = require('./native-symbols')
const { objectValues, compact } = require('./utils')
const { GraphQLSchema, GraphQLObjectType, isListType, isNonNullType, GraphQLType, GraphQLList, GraphQLNonNull, GraphQLNamedType, GraphQLString, GraphQLArgument, GraphQLFieldConfigArgumentMap, GraphQLDirective, GraphQLDirectiveConfig, GraphQLInputObjectType } = require('graphql')

let typeMap;

    var mapType = (type) => {
        if (isListType(type)) {
            return new GraphQLList(mapType(type.ofType));
        }
        if (isNonNullType(type)) {
            return new GraphQLNonNull(mapType(type.ofType));
        }
        const namedType = type; // generics seem to throw off type guard logic
        if (isNativeGraphQLType(namedType)) {
            // do not rename native types but keep the reference to singleton objects like GraphQLString
            return type;
        }
        return findType(namedType.name);
    }

    var findType = (oldName) => {
        if (!(oldName in this.typeMap)) {
            throw new Error(`Unexpected reference to type ${oldName}`);
        }
        return typeMap[oldName];
    }

    var transformArguments = (originalArgs) => {
        const args = {};
        for (const arg of originalArgs) {
            args[arg.name] = {
                description: arg.description,
                type: mapType(arg.type),
                defaultValue: arg.defaultValue,
                astNode: arg.astNode
            };
        }
        return args;
    }
    
    var transformSchema = (schema) => {

        console.log("TRANSFORM SCHEMA", schema)
        typeMap = schema._typeMap;

        let directives = schema._directives.map((x) => new GraphQLDirective({
            name: x.name,
            description: x.description,
            locations: x.locations,
            args: transformArguments(x.args),
            astNode: x.astNode
        }))

        let query = schema._queryType
        let mutation = schema._mutationType
        let subscription = schema._subscriptionType
        
        let rootTypes = compact([query, mutation, subscription])

        console.log(objectValues(typeMap).map((x) => x.getDirectives()))

        let objectTypes = objectValues(typeMap).filter((type) => type instanceof GraphQLObjectType);

        return new GraphQLSchema({
            directives,
            query,
            mutation,
            subscription,
            types: objectTypes
        })

        return schema;
    }

function configurableTransformer (){
    return {
        configurableTypeDefs: `directive @configurable on OBJECT | FIELD_DEFINITION `,
        configurableTransformer: (schema) => {

            //console.log(schema._typeMap)

            return schema
        }
    }
}


module.exports = configurableTransformer
/*{
    transformSchema: (schema: any) => console.log("SCHEMA", schema)
}*/
