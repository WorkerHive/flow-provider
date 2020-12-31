const MongoAdapter = require('../adapters/mongo')
const MSSQLAdapter = require('../adapters/mssql');

const { objectValues } = require('../transforms/utils');
const { objectFlip } = require('../utils/flow-query');
const BaseAdapter = require('./base-adapter');
const { merge, isEqual, unionWith } = require('lodash')

class MergedAdapter extends BaseAdapter{
    constructor(type, storeList, paths){
        super();
        this.type = type
        this.storeList = storeList;
        this.paths = paths;
    }


    mergeActions(bucket, type, get_provider){
        let actions = [];
        for(var k in this.paths){
                if(k !== 'refs'){
                    let pipe = new MongoAdapter(this.storeList.getStore(k).db)
                    for(var col in this.paths[k]){
                        let provider = get_provider(pipe, col, this.type, objectFlip(this.paths[k][col]))
                        actions.push(provider)
                    }
                }
        
        }

        return actions;
    }

    sortActions(type){
        let refs = this.paths.refs;
        let paths = Object.assign({}, this.paths)
        delete paths.refs;

        let primaryActions = [];
        let supportingActions = [];

        for(var store in paths){
            for(var path in paths[store]){
                let map = objectFlip(Object.assign({}, paths[store][path]))

                let refKey = Object.keys(refs).map((x) => {
                    return Object.keys(map).indexOf(x)
                }).filter((a) => a > -1).length > 0

                if(refKey){
                    primaryActions.push({
                        [store]: {
                            [path]: paths[store][path]
                        }
                    })
                }else{
                    supportingActions.push({
                        [store]: {
                            [path]: paths[store][path]
                        }
                    })
                }
                
            }
        }

        return {primaryActions, supportingActions}
        
    }

    iteratePaths(arr, iteree){
        arr.forEach(action => {
            for(var store in action){
                for(var path in action[store]){
                    iteree(store, path, action)
                }
            }
        })
    }

    doActions(get_func){
        const { primaryActions, supportingActions } = this.sortActions(this.type);
        const { refs } = this.paths;

        let actions = [];
        let supporting = [];

        this.iteratePaths(primaryActions, (store, path, action) => {
            let adapter = new MongoAdapter(this.storeList.getStore(store).db)
            let func = get_func(adapter, path, action[store][path])
            actions.push(func)
        })

        this.iteratePaths(supportingActions, (store, path, action) => {
            let adapter = new MongoAdapter(this.storeList.getStore(store).db)

            let _refs = {};
            for(var k in refs){
                let indx = refs[k].map((x) => x.split(':').slice(0,2).join(':')).indexOf(`${store}:${path}`)
                if(indx > -1){
                    _refs[refs[k][indx].split(':')[2]] = k
                }
            }

            merge(_refs, action[store][path])

            let func = get_func(adapter, path, _refs)
            supporting.push(func)
        })
    
        return {actions, supporting}
    }

    getProvider(){

        const { actions, supporting } = this.doActions((adapter, bucket, provides) => {
            return adapter.getProvider({name: bucket}, this.type, provides)
        })

        return (query) => {
            return Promise.all(actions.map((x) => x(query))).then((results) => {
                let r = {}
                results.forEach(item => {
                    merge(r, item)
                })
                return Promise.all(supporting.map((action) => action(query))).then((endResult) => {
                        endResult.forEach(it => {
                        merge(r, it)
                    })
                    return r;
                })

            })
        }
    }

    getAllProvider(){
        const { primaryActions, supportingActions } = this.sortActions(this.type);

        const { refs } = this.paths;

        const { actions, supporting } = this.doActions((adapter, bucket, provides) => {
            return adapter.getAllProvider({name: bucket}, this.type, provides)
        })

        return Promise.all(actions.map((x) => x())).then((result) => {
            let r  = result;

            return Promise.all(supporting.map((action) => action())).then((results) => {
            
                let r2 = results;
                console.log(r, r2, refs)
                return unionWith(r, r2, (arrVal, othVal) => {
                    for(var k in refs){
                        console.log("Checking ref", k)
                        if(isEqual(arrVal[k], othVal[k])){
                            console.log("Checked")
                            return merge(othVal, arrVal)
                        }
                    }
                    return othVal;
                    /*
                    if(`${arrVal.id}` == `${othVal.id}`){
                        console.log("UNION", arrVal, othVal)

                        return merge(othVal, arrVal);
                    }else{
                        return false;
                    }*/
                })[0]

                return results
            })
        })
    }

    //Merged addProvider, batches requests to the appropriate adapter path and creates a cross ref
    addProvider(){
        const { primaryActions, supportingActions } = this.sortActions(this.type)

        const { refs } = this.paths;

        console.log(primaryActions, supportingActions)

        let actions = [];
        let supporting = [];

        primaryActions.forEach((action) => {
            for(var store in action){
                for(var path in action[store]){
                    let adapter = new MongoAdapter(this.storeList.getStore(store).db)
                    console.log(`=> Add Provider ${path} ${this.type} ${JSON.stringify(action[store][path])}`)
                    let add = adapter.addProvider({name: path}, this.type, action[store][path])
                    actions.push(add);
                }
            }
        })
        
        supportingActions.forEach((action) => {
            for(var store in action){
                for(var path in action[store]){
                    let adapter = new MongoAdapter(this.storeList.getStore(store).db)
                    console.log(`=> Supporting Add Provider ${path} ${this.type} ${JSON.stringify(action[store][path])}`)

                    let hasRef = false;
                    let _refs = {};

                    for(var k in refs){
                        let indx = refs[k].map((x) => x.split(':').slice(0,2).join(':')).indexOf(`${store}:${path}`)
                        if(indx > -1){
                            _refs[refs[k][indx].split(':')[2]] = k
                        }
                    }

                     merge(_refs, action[store][path])

            
                    let add = adapter.addProvider({name: path}, this.type, _refs)
                    supporting.push(add)
                }
            }
        })

        return (object) => {
            return Promise.all(actions.map((x) => x(object))).then((result) => {
                let resultObj = {...object};
                result.forEach(item => {
                    for(var k in item){
                        resultObj[k] = item[k]
                    }
                })


                return Promise.all(supporting.map((action) => {
                    return action(resultObj)
                })).then((results) => {
                    let finalResult = {...resultObj}
                    results.forEach(item => {
                        for(var k in item){
                            finalResult[k] = item[k]
                        }
                    })

                    console.log("FINAL RESULT", finalResult)
                    return finalResult
                })

            })
        }

    }

}

module.exports = {
    MergedAdapter
}