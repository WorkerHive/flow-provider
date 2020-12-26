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
            console.log(bucket.name)
            let results = await this.client.collection(`${bucket.name}`).find().toArray()
            return results.map((x) => mapBack(provides, x));
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
            const id = new ObjectId()
            let {idKey, obj} = mapForward(typeDef, provides, newObject)
            console.log(idKey, obj)
            obj[idKey] = id
            console.log(provides)
            this.client.collection(`${bucket.name}`).insertOne(obj)
        }
    }
}

module.exports = MongoAdapter;
