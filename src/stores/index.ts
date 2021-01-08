import { ObjectTypeComposer } from 'graphql-compose';
import { GraphQLObjectType } from 'graphql-compose/lib/graphql';
import FlowPath from '../flow-path';
import { objectValues } from '../transforms/utils';
import MongoStore from './mongo';
import MSSQLStore from './mssql';

const Stores = [MongoStore, MSSQLStore]
export {
    MongoStore,
    MSSQLStore
}

export default class StoreManager {

    public stores : any;

    private timer: any;

    constructor(defaultStores = []){
        this.stores = {}

        if(defaultStores.length > 0){
            this.setupDefaultStores(defaultStores);
        }
       // if(appStore) this.stores['app'] = appStore;

    }

    async rehydrateStores(storeType : ObjectTypeComposer<any, any>){
        if(this.stores.app){
            clearTimeout(this.timer)
            let fp = new FlowPath(storeType, {})
            let b = fp.getBatched()
            console.log(b)
           let result = await this.stores.app.getAdapter().getAllProvider({name: storeType.getTypeName()}, storeType.getType(), b['app'][storeType.getTypeName()])();
            this.setupDefaultStores(result)
        }else{
            clearTimeout(this.timer)
            this.timer = setTimeout(async () => {
                //Retry rehydrateStores every 2 seconds until we can try it with the app store
                await this.rehydrateStores(storeType)
            }, 2 * 1000)
        }
    }

    setupDefaultStores(stores){
        console.log('=> Setting up persisted stores count: ', stores.length)
        stores.forEach(store => {
            let Store = Stores.filter((a) => a.type == store.type.id);
            if(Store.length > 0){
                this.registerStore(store.name, new Store[0]({
                    host: store.host,
                    user: store.user,
                    pass: store.pass,
                    dbName: store.dbName
                }))
            }
        })
    }

    getTypes(){
        return Stores.map((x) => ({
            id: x.type,
            name: x.storeName,
            description: x.description
        }))
    }

    initializeAppStore(opts){
        if(opts.store){
            this.stores['app'] = opts.store
        }else{
            this.stores['app'] = new MongoStore(opts)
        }
    }

    setupStore(opts){
        let Store = Stores.filter((a) => a.type == opts.type.id);
        if(Store.length > 0){
            this.registerStore(opts.name, new Store[0]({
                host: opts.host,
                user: opts.user,
                pass: opts.pass,
                dbName: opts.dbName
            }))
        }
    }

    registerStore(storeKey, store){
        console.log("Register store", storeKey, store);
        if(this.stores[storeKey]){
            return;
        }

        this.stores[storeKey] = store
    }

    get(storeKey){
        return this.getStore(storeKey)
    }

    getStore(storeKey){
        return this.stores[storeKey]
    }

    getAll(){
        let stores = [];
        for(var k in this.stores){
            stores.push({name: k, type: this.stores[k].type})
        }
        return stores;
    }
}
