import { NamedTypeComposer, SchemaComposer, TypeMapper, TypeStorage } from "graphql-compose";

import MergedAdapter from '../adapters';
import FlowPath from '../flow-path'
import StoreManager from "../stores";

export default class FlowConnector{

    private composer: SchemaComposer<any>;
    private flowDefs : any;
    private stores : StoreManager;

    constructor(composer: SchemaComposer<any>, flowDefs, stores){
        this.composer = composer;
        this.flowDefs = flowDefs;
        this.stores = stores;

        (async () => {
            let storeType = this.composer.getOTC('IntegrationStore')
            await this.stores.rehydrateStores(storeType);
        })()
    }

    async add(type, object){
        let flowDef = this.flowDefs[type] || {};   
        let objectType = this.composer.getOTC(type)
        let path = new FlowPath(objectType, flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(objectType, this.stores, batches)
        let result =  await adapter.addProvider()(object)                            
        return result;
    }

    async put(type, query, update){
        let flowDef = this.flowDefs[type] || {};
        let objectType = this.composer.getOTC(type)
        let path = new FlowPath(objectType, flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(objectType, this.stores, batches)
        let result = await adapter.updateProvider()(query, update)

        console.log("PUT RESULT", result);
        return result;

    }

    async delete(type, id){
        let flowDef = this.flowDefs[type] || {};
        let objectType = this.composer.getOTC(type)

        let path = new FlowPath(objectType, flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(objectType, this.stores, batches)
        let result = await adapter.deleteProvider()(id)
        return result;
    }

    async get(type, query){
        let flowDef = this.flowDefs[type] || {};
        let objectType = this.composer.getOTC(type)

        let path = new FlowPath(objectType, flowDef)
        let batches = path.getBatched();
        console.log("Get with", type, query)
        let adapter = new MergedAdapter(objectType, this.stores, batches)
        let fn = adapter.getProvider()
        return await fn(query)
    }

    async getAll(type){
        let flowDef = this.flowDefs[type] || {};
        let objectType = this.composer.getOTC(type)

        const path = new FlowPath(objectType, flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(objectType, this.stores, batches)
        let result = await adapter.getAllProvider()()
        return result;
    }
}

