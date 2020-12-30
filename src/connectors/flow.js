const MergedAdapter = require('../adapters')
const FlowPath = require('../flow-path')

class FlowConnector{

    constructor(typeMap, flowDefs, stores){
        this.typeMap = typeMap;
        this.flowDefs = flowDefs;
        this.stores = stores;

    }

    async add(type, object){
        let flowDef = this.flowDefs[type];
                            
        let path = new FlowPath(this.typeMap[type], flowDef)

        let batches = path.getBatched();

        let adapter = new MergedAdapter(this.typeMap[type], this.stores, batches)
        let result =  await adapter.addProvider()(object)                            
        return result;
    }

    async put(type, id, update){
        let flowDef = this.flowDefs[type];
        let path = new FlowPath(this.typeMap[type], flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(this.typeMap[type], this.stores, batches)
        let result = await adapter.putProvider()(id, update)
        return result;

    }

    async delete(type, id){
        let flowDef = this.flowDefs[type];
        let path = new FlowPath(this.typeMap[type], flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(this.typeMap[type], this.stores, batches)
        let result = await adapter.deleteProvider()(id)
        return result;
    }

    async get(type, id){
        let flowDef = this.flowDefs[type];
        let path = new FlowPath(this.typeMap[type], flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(this.typeMap[type], this.stores, batches)
        let result = await adapter.getProvider()(id)
        return result;
    }

    async getAll(type){
        let flowDef = this.flowDefs[type];
        let path = new FlowPath(this.typeMap[type], flowDef)
        let batches = path.getBatched();
        let adapter = new MergedAdapter(this.typeMap[type], this.stores, batches)
        let result = await adapter.getAllProvider()()
        return result;
    }
}

module.exports = FlowConnector
