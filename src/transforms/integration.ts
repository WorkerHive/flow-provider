
import { schemaComposer, SchemaComposer }  from 'graphql-compose'
import { GraphContext } from '@workerhive/graph'
import { FlowConnector } from '..';
let typeMap;


export const transform = (schema : SchemaComposer<any>) : {types: any, resolvers: any} => {

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
                    resolve: async (parent, args, context : GraphContext) => {
                        return await context.connector.create('IntegrationMap', args.integrationMap)
                    }
                },
                addIntegrationStore: {
                    type: 'IntegrationStore',
                    args: {
                        integrationStore: 'IntegrationStoreInput'
                    },
                    resolve: async (parent, args, context : GraphContext) => {
                        (context.connector as FlowConnector).stores.setupStore(args.integrationStore)
                        return await context.connector.create('IntegrationStore', args.integrationStore)
                    }
                },
                updateIntegrationMap: {
                    type: 'IntegrationMap',
                    args: {
                        id: 'String',
                        integrationMap: 'IntegrationMapInput'
                    },
                    resolve: async (parent, args, context : GraphContext) => {
                        return await context.connector.update('IntegrationMap', {id: args.id}, args.integrationMap);
                    }
                },
                updateIntegrationStore: {
                    type: 'IntegrationStore',
                    args: {
                        id: 'ID',
                        integrationStore: 'IntegrationStoreInput'
                    },
                    resolve: async (parent, args, context : GraphContext) => {
                        return await context.connector.update('IntegrationStore', {id: args.id}, args.integrationStore)
                    }
                },
                deleteIntegrationMap: {
                    type: 'Boolean',
                    args: {
                        id: 'String'
                    }, 
                    resolve: async (parent, args, context : GraphContext) => {
                        return await context.connector.delete('IntegrationMap', {id: args.id})
                    }
                },
                deleteIntegrationStore: {
                    type: 'Boolean',
                    ags: {
                        id: 'ID',
                    },
                    resolve: async (parent, args, context : GraphContext) => {
                        return await context.connector.delete('IntegrationStore', {id: args.id})
                    }
                }
            })

            schemaComposer.Query.addFields({
                storeTypes: {
                    type: '[StoreType]',
                    resolve: (parent, args, context : GraphContext) => {
                        return (context.connector as FlowConnector).stores.getTypes();
                    }
                },
                stores: {
                    type: 'JSON',
                    resolve: (parent, args, context : GraphContext) => {
                        return (context.connector as FlowConnector).stores.getAll();
                    }
                },
                storeBuckets: {
                    type: 'JSON',
                    args: {
                        name: 'String'
                    },
                    resolve: async (parent, args, context : GraphContext) => {
                        return await (context.connector as FlowConnector).stores.get(args.name).getBucketGroups();
                    }
                },
                storeLayout: {
                    type: 'JSON',
                    args: {
                        storeName: 'String'
                    },
                    resolve: async (parent, args, context: GraphContext) => {
                        return await (context.connector as FlowConnector).stores.get(args.storeName).layout();
                    }
                },
                bucketLayout: {
                    type: 'JSON',
                    args: {
                        storeName: 'String',
                        bucketName: 'String'
                    },
                    resolve: async (parent, args, context: GraphContext) => {
                        console.log(`Get bucket layout store: ${args.storeName} bucket: ${args.bucketName}`)
                        const conn : FlowConnector = (context.connector as FlowConnector)
                        const store = conn.stores.stores[args.storeName.trim()];
                        return await store.bucketLayout(args.bucketName);
                    }
                },
                integrationMap: {
                    type: 'IntegrationMap',
                    args: {
                        id: 'String'
                    },
                    resolve: async (parent, args, context : GraphContext) => {
                        return await context.connector.read('IntegrationMap', {id: args.id})
                    }
                },
                integrationMaps: {
                    type: '[IntegrationMap]',
                    resolve: async (parent, args, context : GraphContext) => {
                        return await context.connector.readAll('IntegrationMap')
                    }
                },
                integrationStore: {
                    type: 'IntegrationStore',
                    args: {
                        id: 'ID'
                    },
                    resolve: async (parent, args, context : GraphContext) => {
                        return await context.connector.read('IntegrationStore', {id: args.id})
                    }
                },
                integrationStores: {
                    type: '[IntegrationStore]',
                    resolve: async (parent, args, context : GraphContext) => {
                        return await context.connector.readAll('IntegrationStore')
                    }
                }
            })

            let sdl = schemaComposer.toSDL();
            let resolvers = schemaComposer.getResolveMethods();
            return { types: sdl, resolvers: resolvers}
        }
