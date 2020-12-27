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

const StoreManager = require('./src/stores')

const resolvers = require("./src/resolvers");
const FlowPath = require('./src/flow-path');
const configurableTransformer = require('./src/transforms/configurable');
const crudTransformer = require('./src/transforms/crud');
const { MergedAdapter } = require('./src/adapters');


class FlowProvider{

    constructor(typeDefs, flowDefs, userResolvers){
        this.stores = new StoreManager();
        
        this.typeDefs = typeDefs;
        this.flowDefs = flowDefs;
        this.userResolvers = userResolvers;

        this.flowResolvers = mergeResolvers([resolvers(), userResolvers])

        this.setupServer();
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

                            let adapter = new MergedAdapter(this.server.schema._typeMap[type], this.stores, batches)
                            let result =  await adapter.addProvider()(object)                            
                            return result;
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
                        get: async (type, id) => {
                            let flowDef = this.flowDefs[type];
                            let path = new FlowPath(this.server.schema._typeMap[type], flowDef)

                            let batches = path.getBatched();

                            let adapter = new MergedAdapter(this.server.schema._typeMap[type], this.stores, batches);

                            const result = adapter.getProvider();
                            const rt = await result(id)
                            console.log(rt)
                            return rt;
                        },
                        getAll: async (type) => {
                            let flowDef = this.flowDefs[type];
                            let path = new FlowPath(this.server.schema._typeMap[type], flowDef)
                            
                            let batches = path.getBatched();

                            let adapter = new MergedAdapter(this.server.schema._typeMap[type], this.stores, batches);

                            const result= await adapter.getAllProvider();
                            console.log(result)
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
