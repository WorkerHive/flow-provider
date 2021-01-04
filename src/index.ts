const { transformSchema, gql, ApolloServer, mergeSchemas} = require('apollo-server')

import { makeExecutableSchema } from '@graphql-tools/schema'
import { mergeResolvers } from '@graphql-tools/merge'
import { GraphQLSchema } from 'graphql-compose/lib/graphql';
import FlowConnector from './connectors/flow';
const {GraphQLNamedType, GraphQLObjectType, GraphQLType} = require('graphql')

import StoreManager from './stores';

const MongoStore = require('./stores/mongo')

import { 
    InputDirective,
    CRUDDirective,
    ConfigurableDirective,
    UploadDirective
} from './directives'

import { 
    InputTransform,
    CRUDTransform,
    ConfigurableTransform,
    UploadTranform
} from './transforms'


const resolvers = require("./resolvers");
const FlowPath = require('./flow-path');

const configurableTransformer = require('./transforms/configurable');
const crudTransformer = require('./transforms/crud');
const { MergedAdapter } = require('./adapters');


class FlowProvider{

    public stores : StoreManager = new StoreManager();
    public connector: FlowConnector;

    public server: any;

    public typeDefs : any;
    public flowDefs : any;
    public userResolvers: any;

    public flowResolvers: any;

    public schema: GraphQLSchema;

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
        const { inputTypeDefs, inputTransformer } = InputTransform()
        const { configurableTypeDefs, configurableTransformer } = ConfigurableTransform()
        const { crudTypeDefs, crudTransformer } = CRUDTransform();
        this.schema = makeExecutableSchema({
            typeDefs: [
                `type Query{empty:String} type Mutation{empty:String}`, 
                inputTypeDefs, 
                configurableTypeDefs, 
                crudTypeDefs, 
                uploadTypeDefs,
                this.typeDefs
            ],
            resolvers: this.flowResolvers,
            schemaTransforms: [ uploadTransformer, inputTransformer, configurableTransformer, crudTransformer ]
        })

    }

    applyInit(fn){
        this.connector = new FlowConnector(this.schema.getTypeMap(), this.flowDefs, this.stores);
        this.server = fn({
            schema: this.schema,
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
