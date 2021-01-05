import {  GraphQLUpload } from 'apollo-server'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { mergeResolvers } from '@graphql-tools/merge'
import { GraphQLDirective, GraphQLDirectiveConfig } from 'graphql-compose/lib/graphql';
import { GraphQLSchema } from 'graphql'
import { SchemaComposer, schemaComposer } from 'graphql-compose';

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

import {merge} from 'lodash';
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

    private schemaFactory: SchemaComposer<any>;

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

        this.schemaFactory = schemaComposer;
        let resolvers = this.schemaFactory.getResolveMethods()

        let typeDefs = [
            `type Query {
                empty: String
            }
            type Mutation {
                empty: String
            }
            type Subscription {
                empty: String
            }`,
            this.typeDefs
        ].join(`\n`)

        this.schemaFactory.addTypeDefs(typeDefs)

        let types = [
            inputTypeDefs, 
            configurableTypeDefs, 
            crudTypeDefs, 
            uploadTypeDefs ].join(`\n`)

        inputTransformer(this.schemaFactory)
        crudTransformer(this.schemaFactory)
        uploadTransformer(this.schemaFactory)
        configurableTransformer(this.schemaFactory)

        let typeMap = this.schemaFactory.types;

        typeMap.forEach((val, key) => {
            if(typeof(key) == "string"){
                types += `\n` + val.toSDL();
            }else{
                //console.log(key)
            }
        })

        this.schemaOpts = {
            typeDefs: types,
            resolvers: merge({Upload: GraphQLUpload}, this.flowResolvers, this.schemaFactory.getResolveMethods()),
          //  schemaTransforms: [ uploadTransformer, inputTransformer, configurableTransformer, crudTransformer ],
        }


        this.schema = makeExecutableSchema(this.schemaOpts)

    }

    applyInit(fn){
        this.connector = new FlowConnector(this.schemaFactory, this.flowDefs, this.stores);
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

