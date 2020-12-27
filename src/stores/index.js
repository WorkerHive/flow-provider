const MongoStore = require('./mongo')

class StoreManager {

    constructor(appStore){
        this.stores = {}
        if(appStore) this.stores['app'] = appStore;
    }

    initializeAppStore(opts){
        if(opts.store){
            this.stores['app'] = opts.store
        }else{
            this.stores['app'] = new MongoStore(opts)

        }
    }

    registerStore(storeKey, store){
        if(this.stores[storeKey]){
            return;
        }

        this.stores[storeKey] =store
       
    }

    getStore(storeKey){
        return this.stores[storeKey]
    }
}

module.exports = StoreManager