const { MergedAdapter }  = require('../adapters')
const FlowPath = require('../flow-path')

class FlowConnector{

    constructor(typeMap, flowDefs, stores){
        this.typeMap = typeMap;
        this.flowDefs = flowDefs;
        this.stores = stores;

    }

    async add(type, object){
        let flowDef = this.flowDefs[type] || {};          
        let path = new FlowPath(this.typeMap[type], flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(this.typeMap[type], this.stores, batches)
        let result =  await adapter.addProvider()(object)                            
        return result;
    }

    async put(type, query, update){
        let flowDef = this.flowDefs[type] || {};
        let path = new FlowPath(this.typeMap[type], flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(this.typeMap[type], this.stores, batches)
        let result = await adapter.updateProvider()(query, update)
        return result;

    }

    async delete(type, id){
        let flowDef = this.flowDefs[type] || {};
        let path = new FlowPath(this.typeMap[type], flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(this.typeMap[type], this.stores, batches)
        let result = await adapter.deleteProvider()(id)
        return result;
    }

    async get(type, query){
        let flowDef = this.flowDefs[type] || {};
        let path = new FlowPath(this.typeMap[type], flowDef)
        let batches = path.getBatched();
        console.log("Get with", type, query)
        let adapter = new MergedAdapter(this.typeMap[type], this.stores, batches)
        let fn = adapter.getProvider()
        return await fn(query)
    }

    async getAll(type){
        let flowDef = this.flowDefs[type] || {};
        console.log("Get all flow def", flowDef, this.typeMap, type);
        let path = new FlowPath(this.typeMap[type], flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(this.typeMap[type], this.stores, batches)
        let result = await adapter.getAllProvider()()
        return result;
    }
}

module.exports = FlowConnector
