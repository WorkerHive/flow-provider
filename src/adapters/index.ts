import { ObjectTypeComposer } from "graphql-compose";

import MongoAdapter from '../adapters/mongo'
import MSSQLAdapter from '../adapters/mssql'

const { objectValues } = require('../transforms/utils');
const { objectFlip } = require('../utils/flow-query');
import BaseAdapter from './base-adapter'
const { merge, isEqual, unionWith } = require('lodash')

export default class MergedAdapter extends BaseAdapter {
    constructor(type: ObjectTypeComposer<any>, storeList, paths) {
        super();
        this.type = type.getType();
        this.storeList = storeList;
        this.paths = paths;
    }


    sortActions(type) {
        let refs = this.paths.refs || {};
        let paths = Object.assign({}, this.paths)
        delete paths.refs;

        let primaryActions = [];
        let supportingActions = [];

        for (var store in paths) {
            for (var path in paths[store]) {
                let map = objectFlip(Object.assign({}, paths[store][path]))


                let refKey = !(Object.keys(refs).length > 0) || Object.keys(refs).map((x) => {
                    return Object.keys(map).indexOf(x)
                }).filter((a) => a > -1).length > 0

                if (refKey) {
                    primaryActions.push({
                        [store]: {
                            [path]: paths[store][path]
                        }
                    })
                } else {
                    supportingActions.push({
                        [store]: {
                            [path]: paths[store][path]
                        }
                    })
                }

            }
        }

        return { primaryActions, supportingActions }

    }

    iteratePaths(arr, iteree) {
        arr.forEach(action => {
            for (var store in action) {
                for (var path in action[store]) {
                    iteree(store, path, action)
                }
            }
        })
    }

    doActions(get_func) {
        const { primaryActions, supportingActions } = this.sortActions(this.type);
        const refs = this.paths.refs || {};

        let actions = [];
        let supporting = [];

        this.iteratePaths(primaryActions, (store, path, action) => {
            console.log("Action", action)
            let adapter = this.storeList.get(store).getAdapter();

            let func = get_func(adapter, path, action[store][path])
            actions.push(func)
        })

        this.iteratePaths(supportingActions, (store, path, action) => {
            let adapter = this.storeList.get(store).getAdapter();

            let _refs = {};
            for (var k in refs) {
                let indx = refs[k].map((x) => x.split(':').slice(0, 2).join(':')).indexOf(`${store}:${path}`)
                if (indx > -1) {
                    _refs[refs[k][indx].split(':')[2]] = k
                }
            }

            merge(_refs, action[store][path])

            let func = get_func(adapter, path, _refs)
            supporting.push(func)
        })

        return { actions, supporting }
    }

    getProvider() {

        const { actions, supporting } = this.doActions((adapter, bucket, provides) => {
            return adapter.getProvider({ name: bucket }, this.type, provides)
        })

        console.log(actions.length, supporting.length)
        return (query) => {

            return Promise.all(actions.map((x) => x(query))).then((results) => {
                let r = {}
                results.forEach(item => {
                    merge(r, item)
                })
                if (supporting.length > 0) {
                    return Promise.all(supporting.map((action) => action(query))).then((endResult) => {
                        endResult.forEach(it => {
                            merge(r, it)
                        })
                        return r;
                    })
                } else {
                    return r;
                }

            })
        }
    }

    getAllProvider() {
        let { refs } = this.paths;

        const { actions, supporting } = this.doActions((adapter, bucket, provides) => {
            return adapter.getAllProvider({ name: bucket }, this.type, provides)
        })

        return () => {

            /*
                Split action execution

                actions runs -> [Results[], Results[]]
                actions modifies query if needed
                supporting runs -> [Results[], Results[]]

                results.join(refs)
            */

            return Promise.all(actions.map((x) => x())).then((result) => {
                let r = result;


                return Promise.all(supporting.map((action) => action())).then((results) => {

                    let r2 = results;
                    
                    if(Object.keys(refs).length > 0){
                        refs = {id: []}
                    }

                    //Refs needs to be looked at and adjusted for real use cases, at current it just checks ref keys not foreign keys
                        let union = unionWith(...r, ...r2, (arrVal, othVal) => {
                            for (var k in refs) {
                                console.log("Checking ref", k, arrVal, othVal)
                                if (isEqual(`${arrVal[k]}`, `${othVal[k]}`)) {
                                    console.log("Checked", arrVal[k], othVal[k], arrVal[k] == othVal[k])
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
                        })
                        console.log(union);

                        return union;
                    
                })

            })
        }
    }

    updateProvider() {
        const { actions, supporting } = this.doActions((adapter, bucket, provides) => {
            return adapter.updateProvider({ name: bucket }, this.type, provides);
        })

        return (id, update) => {

            console.log("Update", this.type, id, update);
            return Promise.all(actions.map((action) => {
                return action(id, update)
            })).then((result) => {
                let output = {};
                result.forEach((item) => {
                    output = Object.assign({}, output, item)
                })
                return Promise.all(supporting.map((sAction) => {
                    return sAction(id, update)
                })).then((res) => {
                    let output2 = {};
                    res.forEach((item) => {
                        output2 = Object.assign({}, output2, item);
                    })
                    return Object.assign({}, output, output2)
                })
            })
        }

    }


    //Merged addProvider, batches requests to the appropriate adapter path and creates a cross ref
    addProvider() {
        const { primaryActions, supportingActions } = this.sortActions(this.type)

        const { refs } = this.paths;

        let actions = [];
        let supporting = [];

        primaryActions.forEach((action) => {
            for (var store in action) {
                for (var path in action[store]) {
                    let adapter = new MongoAdapter(this.storeList.getStore(store).db)
                    console.log(`=> Add Provider ${path} ${this.type} ${JSON.stringify(action[store][path])}`)
                    let add = adapter.addProvider({ name: path }, this.type, action[store][path])
                    actions.push(add);
                }
            }
        })

        supportingActions.forEach((action) => {
            for (var store in action) {
                for (var path in action[store]) {
                    let adapter = new MongoAdapter(this.storeList.getStore(store).db)
                    console.log(`=> Supporting Add Provider ${path} ${this.type} ${JSON.stringify(action[store][path])}`)

                    let hasRef = false;
                    let _refs = {};

                    for (var k in refs) {
                        let indx = refs[k].map((x) => x.split(':').slice(0, 2).join(':')).indexOf(`${store}:${path}`)
                        if (indx > -1) {
                            _refs[refs[k][indx].split(':')[2]] = k
                        }
                    }

                    merge(_refs, action[store][path])


                    let add = adapter.addProvider({ name: path }, this.type, _refs)
                    supporting.push(add)
                }
            }
        })

        return (object) => {
            return Promise.all(actions.map((x) => x(object))).then((result) => {
                let resultObj = { ...object };
                result.forEach(item => {
                    for (var k in item) {
                        resultObj[k] = item[k]
                    }
                })


                return Promise.all(supporting.map((action) => {
                    return action(resultObj)
                })).then((results) => {
                    let finalResult = { ...resultObj }
                    results.forEach(item => {
                        for (var k in item) {
                            finalResult[k] = item[k]
                        }
                    })

                    console.log("FINAL RESULT", finalResult)
                    return finalResult
                })

            })
        }

    }

    deleteProvider() {
        const { actions, supporting } = this.doActions((adapter, bucket, provides) => {
            return adapter.deleteProvider({ name: bucket }, this.type, provides);
        })

        //TODO write protect external dbs by default so we dont go deleting waterfalls

        return (query) => {

            let removedCount = 0;
            return Promise.all(actions.map((action) => {
                return action(query)
            })).then((result) => {
                result.forEach(item => {
                    removedCount += item.result.n;
                })

                console.log(result);
                return Promise.all(supporting.map((sAction) => {
                    return sAction(query)
                })).then((otherResult) => {
                    otherResult.forEach(item => {
                        removedCount += item.result.n;
                    })
                })
            }).then((r) => {
                console.log(r)

                return removedCount > 0; //TODO actually plumb this in
            })
        }
    }

}
