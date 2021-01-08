import { GraphQLSchema } from 'graphql'
import { SchemaComposer, schemaComposer } from 'graphql-compose';

import StoreManager from './stores';

import { MongoStore, MSSQLStore } from './stores'

import { BaseConnector, GraphBase } from '@workerhive/graph';
//Replace below

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

    private parent: GraphBase;
    private schemaFactory: SchemaComposer<any>;

    constructor(flowDefs, userResolvers){
        super();
        this.stores = new StoreManager();
        this.flowDefs = flowDefs;
        this.userResolvers = userResolvers;
        this.flowResolvers = merge(resolvers, userResolvers)
    }

    setParent(parent : GraphBase){
        this.parent = parent;
        
        this.schemaFactory.merge(parent.schema)
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

