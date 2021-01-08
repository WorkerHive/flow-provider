import { Transform, mergeSchemas, gql } from 'apollo-server'
import { getDirectives, mapSchema, MapperKind } from '@graphql-tools/utils'
import { isNativeGraphQLType } from './native-symbols'
import { objectValues, compact } from './utils'
import { GraphQLSchema, GraphQLObjectType, isListType, GraphQLID, GraphQLBoolean, isNonNullType, GraphQLType, GraphQLList, GraphQLNonNull, GraphQLNamedType, GraphQLString, GraphQLArgument, GraphQLFieldConfigArgumentMap, GraphQLDirective, GraphQLDirectiveConfig, GraphQLInputObjectType } from 'graphql'
import { findTypesWithDirective } from "../utils"
import { camelCase }  from "camel-case"
import { NamedTypeComposer, schemaComposer, SchemaComposer }  from 'graphql-compose'
let typeMap;


export default function integrationTransformer (){
    return {
        integrationTypeDefs: `directive @store on OBJECT \n directive @integration on OBJECT`,
        integrationTransformer: (schema : SchemaComposer<any>) => {

            schemaComposer.merge(schema);

  
            schemaComposer.createInputTC({
                name: 'IntegrationMapInput',
                fields: {
                    nodes: '[JSON]',
                    links: '[JSON]'
                }
            })

            schemaComposer.createInputTC({
                name: 'IntegrationStoreInput',
                fields: {
                    name: 'String',
                    type: 'StoreTypeInput',
                    host: 'String',
                    dbName: 'String',
                    user: 'String',
                    pass: 'String'
                }
            })


            schemaComposer.createInputTC({
                name: 'StoreTypeInput',
                fields: {
                    id: 'ID'
                }
            })

            schemaComposer.createObjectTC({
                name: 'StoreType',
                fields: {
                    id: 'ID',
                    name: 'String',
                    description: 'String'
                }
            })

            schemaComposer.createObjectTC({
                name: 'IntegrationMap',
                fields: {
                    id: 'String',
                    nodes: 'JSON',
                    links: 'JSON'
                }
            })

            schemaComposer.createObjectTC({
                name: 'IntegrationStore',
                fields: {
                    id: 'ID',
                    name: 'String',
                    host: 'String',
                    user: 'String',
                    pass: 'String',
                    dbName: 'String',
                    type: 'StoreType'
                }
            })

            schemaComposer.Mutation.addFields({
                addIntegrationMap: {
                    type: 'IntegrationMap',
                    args: {
                        integrationMap: 'IntegrationMapInput'
                    },
                    resolve: async (parent, args, context) => {
                        return await context.connections.flow.add('IntegrationMap', args.integrationMap)
                    }
                },
                addIntegrationStore: {
                    type: 'IntegrationStore',
                    args: {
                        integrationStore: 'IntegrationStoreInput'
                    },
                    resolve: async (parent, args, context) => {
                        context.connections.flow.stores.setupStore(args.integrationStore)
                        return await context.connections.flow.add('IntegrationStore', args.integrationStore)
                    }
                },
                updateIntegrationMap: {
                    type: 'IntegrationMap',
                    args: {
                        id: 'String',
                        integrationMap: 'IntegrationMapInput'
                    },
                    resolve: async (parent, args, context) => {
                        console.log('Update integration map', args)
                        return await context.connections.flow.put('IntegrationMap', {id: args.id}, args.integrationMap);
                    }
                },
                updateIntegrationStore: {
                    type: 'IntegrationStore',
                    args: {
                        id: 'ID',
                        integrationStore: 'IntegrationStoreInput'
                    },
                    resolve: async (parent, args, context) => {
                        return await context.connections.flow.put('IntegrationStore', {id: args.id}, args.integrationStore)
                    }
                },
                deleteIntegrationMap: {
                    type: 'Boolean',
                    args: {
                        id: 'String'
                    }, 
                    resolve: async (parent, args, context) => {
                        return await context.connections.flow.delete('IntegrationMap', {id: args.id})
                    }
                },
                deleteIntegrationStore: {
                    type: 'Boolean',
                    ags: {
                        id: 'ID',
                    },
                    resolve: async (parent, args, context) => {
                        
                        return await context.connections.flow.delete('IntegrationStore', {id: args.id})
                    }
                }
            })

            schemaComposer.Query.addFields({
                storeTypes: {
                    type: 'StoreType',
                    resolve: (parent, args, context) => {
                        return context.connections.flow.stores.getTypes();
                    }
                },
                stores: {
                    type: 'JSON',
                    resolve: (parent, args, context) => {
                        return context.connections.flow.stores.getAll();
                    }
                },
                storeLayout: {
                    type: 'JSON',
                    args: {
                        name: 'String'
                    },
                    resolve: async (parent, args, context) => {
                        return await context.connections.flow.stores.get(args.name).getBucketGroups();
                    }
                },
                integrationMap: {
                    type: 'IntegrationMap',
                    args: {
                        id: 'String'
                    },
                    resolve: async (parent, args, context) => {
                        return await context.connections.flow.get('IntegrationMap', {id: args.id})
                    }
                },
                integrationMaps: {
                    type: '[IntegrationMap]',
                    resolve: async (parent, args, context) => {
                        return await context.connections.flow.getAll('IntegrationMap')
                    }
                },
                integrationStore: {
                    type: 'IntegrationStore',
                    args: {
                        id: 'ID'
                    },
                    resolve: async (parent, args, context) => {
                        return await context.connections.flow.get('IntegrationStore', {id: args.id})
                    }
                },
                integrationStores: {
                    type: '[IntegrationStore]',
                    resolve: async (parent, args, context) => {
                        return await context.connections.flow.getAll('IntegrationStore')
                    }
                }
            })
            return schemaComposer.buildSchema();
        }
    }
}

