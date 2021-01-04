import {  GraphQLUpload } from 'apollo-server'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { mergeResolvers } from '@graphql-tools/merge'
import { GraphQLDirective, GraphQLDirectiveConfig } from 'graphql-compose/lib/graphql';
import { GraphQLSchema } from 'graphql'
import { schemaComposer } from 'graphql-compose';

import FlowConnector from './connectors/flow';
import StoreManager from './stores';

import MongoStore from './stores/mongo'

const { 
    InputDirective,
    CRUDDirective,
    ConfigurableDirective,
    UploadDirective
} = require('./directives')

import { 
    InputTransform,
    CRUDTransform,
    ConfigurableTransform,
    UploadTranform
} from './transforms'


import FlowPath from './flow-path'
import {merge} from 'lodash';
import { MergedAdapter } from './adapters'
import resolvers from './resolver-base'

export class FlowProvider{

    public stores : StoreManager = new StoreManager();
    public connector: FlowConnector;

    public server: any;

    public typeDefs : any;
    public flowDefs : any;
    public userResolvers: any;

    public flowResolvers: any;

    public schema: GraphQLSchema;
    public schemaOpts: any;

    constructor(typeDefs, flowDefs, userResolvers, ){
        this.stores = new StoreManager();
        
        this.typeDefs = typeDefs;
        this.flowDefs = flowDefs;
        this.userResolvers = userResolvers;

        this.flowResolvers = merge(resolvers, userResolvers)

        this.setupServer();
    }


    setupServer(){
        const { uploadTypeDefs, uploadTransformer } = UploadTranform()
        const { inputTypeDefs, inputTransformer } = InputTransform()
        const { configurableTypeDefs, configurableTransformer } = ConfigurableTransform()
        const { crudTypeDefs, crudTransformer } = CRUDTransform();

        console.log("Adding type defs")
        let resolvers = schemaComposer.getResolveMethods()

        let typeDefs = [
            this.typeDefs
        ].join(`\n`)
        schemaComposer.addTypeDefs(typeDefs)

        let types = [
            `scalar Upload`,
            `type Query {
                empty: String
            }
            type Mutation {
                empty: String
            }`,
            inputTypeDefs, 
            configurableTypeDefs, 
            crudTypeDefs, 
            uploadTypeDefs ].join(`\n`)

        let typeMap = schemaComposer.types;

        
        typeMap.forEach((val, key) => {
            if(typeof(key) == "string"){
                types += `\n` + val.toSDL();
            }else{
                //console.log(key)
            }
          
        })

        this.schemaOpts = {
            typeDefs: types,
            resolvers: merge({Upload: GraphQLUpload}, this.flowResolvers),
            schemaTransforms: [ uploadTransformer, inputTransformer, configurableTransformer, crudTransformer ],
        }

        this.schema = makeExecutableSchema(this.schemaOpts)
    }

    applyInit(fn){
        this.connector = new FlowConnector(this.schema.getTypeMap(), this.flowDefs, this.stores);
        this.server = fn({
            schema: this.schemaOpts,
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

