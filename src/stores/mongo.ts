import {MongoClient} from 'mongodb'
import MongoAdapter from '../adapters/mongo';
import BaseStore from './base'

export default class MongoStore extends BaseStore {

    public static type : String = "mongo";
    public static storeName: String = "MongoDB";
    public static description : String = "MongoDB Server";



    public db : any;


    constructor(config){
        super(config);

        MongoClient.connect(config.url).then((client) => {
            let db = client.db(config.dbName)
            this.db = db;
        })
        
    }


    getAdapter() : MongoAdapter{
        return new MongoAdapter(this.db);
    }
}


