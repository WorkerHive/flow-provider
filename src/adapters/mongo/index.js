const { ObjectId } = require("mongodb");
const {  objectFlip, mapForward, mapBack, mapQuery } = require("../../utils/flow-query");
const BaseAdapter = require("../base-adapter");

class MongoAdapter extends BaseAdapter{

    constructor(db){
        super();
        this.client = db;
    }

    getProvider(bucket, typeDef, provides){
        return async (search) => {
            for(var k in search){
                search[k] = (typeDef._fields[k].type == "ID") ?  ObjectId(search[k]) : search[k];
            }
            let query = mapQuery(objectFlip(provides), search)
            let result = await this.client.collection(`${bucket.name}`).findOne(query)
            console.log("Get Result", result, query, bucket)
            return mapForward(typeDef, provides, result)
        }
    }

    getAllProvider(bucket, typeDef, provides){
        return async () => {
            let results = await this.client.collection(`${bucket.name}`).find().toArray()
            return results.map((x) => mapForward(typeDef, provides, x));
        }
    }

    updateProvider(bucket, typeDef, provides){
        return async(query, obj) => {
            for(var k in query){
                query[k] = (typeDef._fields[k].type == "ID") ? ObjectId(query[k]) : query[k]
            }

            let q = mapQuery(objectFlip(provides), query)
            let inputObject = mapBack(provides, obj)
            return await this.client.collection(`${bucket.name}`).updateOne(q, inputObject)
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
