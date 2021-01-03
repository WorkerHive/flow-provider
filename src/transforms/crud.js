const { Transform, mergeSchemas, gql } = require('apollo-server')
const { getDirectives, mapSchema, MapperKind } = require('@graphql-tools/utils')
const { isNativeGraphQLType } = require('./native-symbols')
const { objectValues, compact } = require('./utils')
const { GraphQLSchema, GraphQLObjectType, isListType, GraphQLID, GraphQLBoolean, isNonNullType, GraphQLType, GraphQLList, GraphQLNonNull, GraphQLNamedType, GraphQLString, GraphQLArgument, GraphQLFieldConfigArgumentMap, GraphQLDirective, GraphQLDirectiveConfig, GraphQLInputObjectType } = require('graphql')
const { findTypesWithDirective } = require("../utils")
const { camelCase } =  require("camel-case");
const { schemaComposer } = require('graphql-compose')
let typeMap;


function crudTransformer (){
    return {
        crudTypeDefs: `directive @crud on OBJECT`,
        crudTransformer: (schema) => {

            schemaComposer.merge(schema);

            console.log("CRUD TRANSFORM")

            let dirs = findTypesWithDirective(schema._typeMap, 'crud')

            let Query = {}
            let Mutation = {}

            let mutationFields = {};
            let queryFields = {};

            for(var i = 0; i < dirs.length; i++){

            
                let args = {}

                const objectName = dirs[i].name;

                args[camelCase(objectName)] = `${objectName}Input`
                
                const addTag = `add${objectName}`
                const updateTag = `update${objectName}`
                const deleteTag = `delete${objectName}`

                const getAllTag = `${camelCase(objectName)}s`
                const getTag = `${camelCase(objectName)}`;

                schemaComposer.Mutation.addFields({
                    [addTag]: {
                        type: objectName,
                        args: args,
                        resolve: async (parent, args, context) => {
                            //Add one of item
                            console.log(addTag, objectName)
                            return await context.connections.flow.add(objectName, args[camelCase(objectName)])
                        }
                    },
                    [updateTag]: {
                        type: objectName,
                        args: {
                            ...args,
                            id: 'ID'
                        },
                        resolve: async (parent, args, context) => {
                            //Update one of item
                            return await context.connections.flow.put(objectName, {id: args.id}, args[camelCase(objectName)])
                        }
                    },
                    [deleteTag]: {
                        type: 'Boolean',
                        args: {
                            id: 'ID'
                        },
                        resolve: async (parent, args, context) => {
                            //Remove one of item
                            return await context.connections.flow.delete(objectName, {id: args.id})
                        }
                    }
                })

                schemaComposer.Query.addFields({
                    [getAllTag]:{
                        type: `[${objectName}]`,
                        resolve: async (parent, _args, context, info) => {
                            //Get all of item
                            return await context.connections.flow.getAll(objectName)
                        }
                    },
                    [getTag]: {
                        type: objectName,
                        args: {
                            id: 'ID'
                        },
                        resolve: async (parent, {id}, context, info) => {
                            //Get one of item
                            return await context.connections.flow.get(objectName, {id: id});
                        }
                    }
                })

           
  
            }

            
            return schemaComposer.buildSchema();
        }
    }
}


module.exports = crudTransformer
