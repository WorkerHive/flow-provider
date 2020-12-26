const { transformSchema, gql, ApolloServer, mergeSchemas} = require('apollo-server')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const { mergeResolvers } = require('@graphql-tools/merge');
const {GraphQLNamedType, GraphQLObjectType, GraphQLType} = require('graphql')

const MongoAdapter = require('./src/adapters/mongo')
const MSSQLAdapter = require('./src/adapters/mssql')

const MongoStore = require('./src/stores/mongo')

const InputDirective = require('./src/directives/input')
const CRUDDirective = require('./src/directives/crud')
const ConfigurableDirective = require('./src/directives/configurable')

const InputTransform = require('./src/transforms/input')
const ConfigurableTransform = require('./src/transforms/configurable')
const CRUDTransform = require('./src/transforms/crud')

const resolvers = require("./src/resolvers");
const FlowPath = require('./src/flow-path');
const configurableTransformer = require('./src/transforms/configurable');
const crudTransformer = require('./src/transforms/crud');
const { MergedAdapter } = require('./src/adapters');


class FlowProvider{

    constructor(typeDefs, flowDefs, userResolvers){
        this.stores = {};
        this.typeDefs = typeDefs;
        this.flowDefs = flowDefs;
        this.userResolvers = userResolvers;

        this.flowResolvers = mergeResolvers([resolvers(), userResolvers])

        this.setupServer();
    }

    initializeAppStore(opts){
        if(opts.store){
            this.store = {
                    store: opts.store,
                    type: opts.storeType,
                };
        }else{
            this.store = {
                store: new MongoStore(opts),
                type: "mongodb"
            }
        }
    }

    registerStore(storeKey, storeType, store){
        if(this.stores[storeKey]){
            return;
        }

        this.stores[storeKey] = {
            type: storeType,
            store: store
        }
    }

    setupServer(){
        const { inputTransformTypeDefs, inputTransformTransformer } = InputTransform()
        const { configurableTypeDefs, configurableTransformer } = ConfigurableTransform()
        const { crudTypeDefs, crudTransformer } = CRUDTransform();
        this.schema = makeExecutableSchema({
            typeDefs: [
                `type Query{empty:String} type Mutation{empty:String}`, 
                inputTransformTypeDefs, 
                configurableTypeDefs, 
                crudTypeDefs, 
                this.typeDefs
            ],
            resolvers: this.flowResolvers,
            schemaTransforms: [ inputTransformTransformer, configurableTransformer, crudTransformer ],
            schemaDirectives: {
                configurable: ConfigurableDirective,
                input: InputDirective,
                crud: CRUDDirective
            }
        })
        this.server = new ApolloServer({
            schema: this.schema,
            schemaDirectives: {
                configurable: ConfigurableDirective,
                crud: CRUDDirective,
                input: InputDirective
            },
            context: {
                connections: {
                    flow: {
                        add: async (type, object) => {
                            let flowDef = this.flowDefs[type];
                            
                            let path = new FlowPath(this.server.schema._typeMap[type], flowDef)

                            let batches = path.getBatched();

                            let adapter = new MergedAdapter(this.server.schema._typeMap[type], this.store, this.stores, batches)

                            return await adapter.addProvider()(object)                            
                        },
                        put: (type, id, object) => {
                            let flowDef = this.flowDefs[type];
                            let path = new FlowPath(this.server.schema._typeMap[type], flowDef)

                            let sql = new MSSQLAdapter();
                            let update = sql.updateProvider({name: type}, this.server.schema._typeMap[type], flowDef)
                            let r = update(id, object)
                        },
                        delete: (type, id) => {
                            let flowDef = this.flowDefs[type];
                            let path = new FlowPath(this.server.schema._typeMap[type], flowDef)

                        },
                        get: (type, id) => {
                            let flowDef = this.flowDefs[type];
                            let path = new FlowPath(this.server.schema._typeMap[type], flowDef)
                        },
                        getAll: async (type) => {
                            let flowDef = this.flowDefs[type];
                            let path = new FlowPath(this.server.schema._typeMap[type], flowDef)
                            
                            let batches = path.getBatched();

                            let actions = [];

                            let adapter = new MergedAdapter(this.server.schema._typeMap[type], this.store, this.stores, batches);


                            const result= await adapter.getAllProvider();
                            console.log("RES", result);
                            return result;
                        },
                    }
                }
            }
        })
    }

    startServer(port){
        return this.server.listen({port: port})
    }

}


module.exports = {
    FlowProvider,
    MongoStore
}
