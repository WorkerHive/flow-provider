const MongoAdapter = require('../adapters/mongo')
const MSSQLAdapter = require('../adapters/mssql');
const { objectValues } = require('../transforms/utils');
const { objectFlip } = require('../utils/flow-query');
const BaseAdapter = require('./base-adapter');

class MergedAdapter extends BaseAdapter{
    constructor(type, appStore, storeList, paths){
        super();
        this.type = type
        this.appStore = appStore;
        this.storeList = storeList;
        this.paths = paths;

        
        
    }


    mergeActions(bucket, type, get_provider){
        let actions = [];
        for(var k in this.paths){
            if(k !== "app"){
                let pipe = new MongoAdapter(this.storeList[k].store.db)
                for(var col in this.paths[k]){
                    let provider = get_provider(pipe, col, this.type, objectFlip(this.paths[k][col]))
                    actions.push(provider)
                }
            }
        }

        let adapter = new MongoAdapter(this.appStore.store.db)
        let func = get_provider(adapter, type, type, objectFlip(this.paths["app"][type]))
        actions.push(func)
        return actions;
    }

    getAllProvider(){
        let actions = this.mergeActions(this.bucket, this.type, (adapter, bucket, type, paths) => {
            return adapter.getAllProvider({name: bucket || type}, type, paths)
        });
        return Promise.all(actions.map((x) => x()))
    }

    //Merged addProvider, batches requests to the appropriate adapter path and creates a cross ref
    addProvider(){
        let actions = this.mergeActions(this.bucket, this.type, (adapter, bucket, type, paths) => {
            //Do whatever logic and return an addProvider here
            let fields = objectValues(type.getFields())
            let idKey = fields.filter(a => a.type == "ID")[0]
            console.log(paths[idKey.name])
            return adapter.addProvider({name: bucket || type}, type, paths)
        })
        return (object) => {
            return Promise.all(actions.map((x) => x(object)))
        }
    }

}

module.exports = {
    MergedAdapter
}