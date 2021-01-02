const { transformSchema, gql, ApolloServer, mergeSchemas} = require('apollo-server')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const { mergeResolvers } = require('@graphql-tools/merge');
const {GraphQLNamedType, GraphQLObjectType, GraphQLType} = require('graphql')

const MongoAdapter = require('./src/adapters/mongo')
const MSSQLAdapter = require('./src/adapters/mssql')

const MongoStore = require('./src/stores/mongo')

const UploadDirective = require('./src/directives/upload');
const InputDirective = require('./src/directives/input')
const CRUDDirective = require('./src/directives/crud')
const ConfigurableDirective = require('./src/directives/configurable')

const InputTransform = require('./src/transforms/input')
const ConfigurableTransform = require('./src/transforms/configurable')
const CRUDTransform = require('./src/transforms/crud')
const UploadTranform = require('./src/transforms/upload')

const StoreManager = require('./src/stores')

const resolvers = require("./src/resolvers");
const FlowPath = require('./src/flow-path');
const FlowConnector = require('./src/connectors/flow');
const configurableTransformer = require('./src/transforms/configurable');
const crudTransformer = require('./src/transforms/crud');
const { MergedAdapter } = require('./src/adapters');


class FlowProvider{

    constructor(typeDefs, flowDefs, userResolvers, ){
        this.stores = new StoreManager();
        
        this.typeDefs = typeDefs;
        this.flowDefs = flowDefs;
        this.userResolvers = userResolvers;

        this.flowResolvers = mergeResolvers([resolvers(), userResolvers])

        this.setupServer();
    }


    setupServer(){
        const { uploadTypeDefs, uploadTransformer } = UploadTranform()
        const { inputTransformTypeDefs, inputTransformTransformer } = InputTransform()
        const { configurableTypeDefs, configurableTransformer } = ConfigurableTransform()
        const { crudTypeDefs, crudTransformer } = CRUDTransform();
        this.schema = makeExecutableSchema({
            typeDefs: [
                `type Query{empty:String} type Mutation{empty:String}`, 
                inputTransformTypeDefs, 
                configurableTypeDefs, 
                crudTypeDefs, 
                uploadTypeDefs,
                this.typeDefs
            ],
            resolvers: this.flowResolvers,
            schemaTransforms: [ uploadTransformer, inputTransformTransformer, configurableTransformer, crudTransformer ],
            schemaDirectives: {
                upload: UploadDirective,
                configurable: ConfigurableDirective,
                input: InputDirective,
                crud: CRUDDirective
            }
        })

    }

    applyInit(fn){
        this.connector = new FlowConnector(this.schema._typeMap, this.flowDefs, this.stores);
        this.server = fn({
            schema: this.schema,
            schemaDirectives: {
                upload: UploadDirective,
                configurable: ConfigurableDirective,
                crud: CRUDDirective,
                input: InputDirective
            },
            context: {
                connections: {
                    flow: this.connector
                }
            }
        })
    }

}


module.exports = {
    FlowProvider,
    MongoStore
}
