const { ObjectId } = require("mongodb");
const { mapForward, mapBack } = require("../../utils/flow-query");
const BaseAdapter = require("../base-adapter");

class MongoAdapter extends BaseAdapter{

    constructor(db){
        super();
        this.client = db;
    }

    getProvider(bucket, typeDef, provides){
        return async (search) => {
            this.client.collection(`${bucket.name}`).findOne(search)
        }
    }

    getAllProvider(bucket, typeDef, provides){
        return async () => {
            let results = await this.client.collection(`${bucket.name}`).find().toArray()
            return results.map((x) => mapForward(typeDef, provides, x));
        }
    }

    updateProvider(bucket, typeDef, provides){
        return async(id, obj) => {
            this.client.collection(`${bucket.name}`).updateOne({}, obj)
        }
    }

    deleteProvider(bucket, typeDef, provides){
        return async(id) => {
            this.client.collection(`${bucket.name}`).deleteOne({id: id})
        }
    }

    addProvider(bucket, typeDef, provides){
        return async(newObject) => {
            let  obj = mapBack(provides, newObject)
            console.log("New object add provider", obj, provides, newObject)
            let newObj = await this.client.collection(`${bucket.name}`).insertOne(obj)
            return mapForward(typeDef, provides, newObj.ops[0])
        }
    }
}

module.exports = MongoAdapter;
