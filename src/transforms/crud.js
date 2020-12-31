const { Transform, mergeSchemas, gql } = require('apollo-server')
const { getDirectives, mapSchema, MapperKind } = require('@graphql-tools/utils')
const { isNativeGraphQLType } = require('./native-symbols')
const { objectValues, compact } = require('./utils')
const { GraphQLSchema, GraphQLObjectType, isListType, GraphQLID, GraphQLBoolean, isNonNullType, GraphQLType, GraphQLList, GraphQLNonNull, GraphQLNamedType, GraphQLString, GraphQLArgument, GraphQLFieldConfigArgumentMap, GraphQLDirective, GraphQLDirectiveConfig, GraphQLInputObjectType } = require('graphql')
const { findTypesWithDirective } = require("../utils")
const { camelCase } =  require("camel-case");

let typeMap;


function crudTransformer (){
    return {
        crudTypeDefs: `directive @crud on OBJECT`,
        crudTransformer: (schema) => {

            console.log("CRUD TRANSFORM")

            let dirs = findTypesWithDirective(schema._typeMap, 'crud')

            let Query = {}
            let Mutation = {}

            let mutationFields = {};
            let queryFields = {};

            for(var i = 0; i < dirs.length; i++){

            
                let args = {}

                const objectName = dirs[i].name;

                args[camelCase(objectName)] = {type: schema._typeMap[`${objectName}Input`]}
                
                const addTag = `add${objectName}`
                const updateTag = `update${objectName}`
                const deleteTag = `delete${objectName}`

                const getAllTag = `${camelCase(objectName)}s`
                const getTag = `${camelCase(objectName)}`;

                mutationFields[addTag] = {
                    type: schema._typeMap[objectName],
                    args: args
                }

                mutationFields[updateTag] = {
                    type: schema._typeMap[objectName],
                    args: {
                        ...args,
                        id: {type: GraphQLID}
                    }
                }

                mutationFields[deleteTag] = {
                    type: GraphQLBoolean,
                    args: {
                        ...args,
                        id: {type: GraphQLID}
                    }
                }

                queryFields[getAllTag] = {
                    type: new GraphQLList(schema._typeMap[objectName])
                }

                queryFields[getTag] = {
                    type: schema._typeMap[objectName],
                    args: {
                        id: {type: GraphQLID}
                    }
                }

                Query[getAllTag] = async (parent, _args, context, info) => {
                    //Get all of item
                    return await context.connections.flow.getAll(objectName)
                }

                Query[getTag] = async (parent, {id}, context, info) => {
                    //Get one of item
                    return await context.connections.flow.get(objectName, {id: id});
                }
            
                Mutation[addTag] = async (parent, args, context) => {
                    //Add one of item
                    console.log(addTag, objectName)
                    return await context.connections.flow.add(objectName, args[camelCase(objectName)])
                }

                Mutation[updateTag] = async (parent, args, context) => {
                    //Update one of item
                    return await context.connections.flow.put(objectName, {id: args.id}, args[camelCase(objectName)])
                }

                Mutation[deleteTag] = async (parent, args, context) => {
                    //Remove one of item
                    return await context.connections.flow.delete(objectName, {id: args.id})
                }
            }


            let mutation = new GraphQLObjectType({
                name: 'Mutation',
                fields: mutationFields
            })
            
            let query = new GraphQLObjectType({
                name: 'Query',
                fields: queryFields
            })

            let crudSchema = new GraphQLSchema({
                types: [mutation, query],
            })
            
            return mergeSchemas({schemas: [schema, crudSchema], resolvers: [{Mutation, Query}]})
        }
    }
}


module.exports = crudTransformer
