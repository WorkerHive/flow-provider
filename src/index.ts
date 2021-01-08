import { GraphQLSchema } from 'graphql'
import { SchemaComposer, schemaComposer } from 'graphql-compose';

import StoreManager from './stores';

import { MongoStore, MSSQLStore } from './stores'

import { BaseConnector, BaseGraph } from '@workerhive/graph';
//Replace below
import { transform as setupConfig } from './transforms/integration'
import {merge} from 'lodash';
import resolvers from './resolver-base'
import MergedAdapter from './adapters';
import FlowPath from './flow-path';

export class FlowConnector extends BaseConnector{

    public stores : StoreManager;
    public connector: FlowConnector;

    public server: any;

    public typeDefs : any;
    public flowDefs : any;
    public userResolvers: any;

    public flowResolvers: any;

    public schema: GraphQLSchema;
    public schemaOpts: any;

    constructor(flowDefs, userResolvers){
        super();
        this.stores = new StoreManager();
        this.flowDefs = flowDefs;
        this.userResolvers = userResolvers;
        this.flowResolvers = merge(resolvers, userResolvers)
    }

    getConfig(){
        //Get typedefs and resolvers for integration
        return setupConfig(this.schemaFactory)
    }

    setParent(parent : any){
        this.parent = parent;

        if(parent.typeRegistry.sdl) this.schemaFactory.addTypeDefs(parent.typeRegistry.sdl)

        this.parent.on('schema_update', (schema) => {
         this.schemaFactory = schemaComposer.clone();
         this.schemaFactory.addTypeDefs(parent.typeRegistry.sdl);
        })
    }

    async create(type, object){
        let flowDef = this.flowDefs[type] || {};   
        let objectType = this.schemaFactory.getOTC(type)
        let path = new FlowPath(objectType, flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(objectType, this.stores, batches)
        let result =  await adapter.addProvider()(object)                            
        return result;
    }

    async update(type, query, update){
        let flowDef = this.flowDefs[type] || {};
        let objectType = this.schemaFactory.getOTC(type)
        let path = new FlowPath(objectType, flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(objectType, this.stores, batches)
        let result = await adapter.updateProvider()(query, update)

        console.log("PUT RESULT", result);
        return result;

    }

    async delete(type : string, query: object) : Promise<boolean> {
        let flowDef = this.flowDefs[type] || {};
        let objectType = this.schemaFactory.getOTC(type)

        let path = new FlowPath(objectType, flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(objectType, this.stores, batches)
        let result = await adapter.deleteProvider()(query)
        return result;
    }

    async read(type, query){
        let flowDef = this.flowDefs[type] || {};
        let objectType = this.schemaFactory.getOTC(type)

        let path = new FlowPath(objectType, flowDef)
        let batches = path.getBatched();
        console.log("Get with", type, query)
        let adapter = new MergedAdapter(objectType, this.stores, batches)
        let fn = adapter.getProvider()
        return await fn(query)
    }

    async readAll(type){
        let flowDef = this.flowDefs[type] || {};
        let objectType = this.schemaFactory.getOTC(type)

        const path = new FlowPath(objectType, flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(objectType, this.stores, batches)
        let result = await adapter.getAllProvider()()
        return result;
    }

}


export { 
    MongoStore,
    MSSQLStore
}

