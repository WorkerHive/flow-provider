import {  GraphQLUpload } from 'apollo-server'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { mergeResolvers } from '@graphql-tools/merge'
import { GraphQLSchema } from 'graphql-compose/lib/graphql';
import { schemaComposer } from 'graphql-compose';

import FlowConnector from './connectors/flow';
import StoreManager from './stores';

import MongoStore from './stores/mongo'

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


import resolvers from "./resolvers"
import FlowPath from './flow-path'
import {merge} from 'lodash';
import { MergedAdapter } from './adapters'

export class FlowProvider{

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

        schemaComposer.addTypeDefs([
            `type Query{
                empty:String
            } 
            type Mutation{
                empty:String
            }`, 
            inputTypeDefs, 
            configurableTypeDefs, 
            crudTypeDefs, 
            uploadTypeDefs,
            this.typeDefs
        ].join(` `))

        //schemaComposer.addResolveMethods(this.flowResolvers)

        schemaComposer.buildSchema().getTypeMap()
        this.schema = makeExecutableSchema({
            typeDefs: `scalar Upload \n` + schemaComposer.toSDL(),
            resolvers: merge({Upload: GraphQLUpload}, this.flowResolvers),
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


export { 
    MongoStore
}

