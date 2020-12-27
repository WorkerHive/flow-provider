const {MongoClient} = require('mongodb')
const BaseStore = require('./base')

class MongoStore extends BaseStore {
    
    constructor(config){
        super(config)
        MongoClient.connect(config.url).then((client) => {
            let db = client.db(config.dbName)
            this.db = db;
        })
        
    }
}

MongoStore.type = "mongodb";

module.exports = MongoStore;

