import { GraphQLObjectType } from "graphql-compose/lib/graphql";

const { ObjectId } = require("mongodb");
const {  objectFlip, mapForward, mapBack, mapQuery } = require("../../utils/flow-query");
const BaseAdapter = require("../base-adapter");

export default class MongoAdapter extends BaseAdapter{

    constructor(db){
        super();
        this.client = db;
    }

    getProvider(bucket : any, typeDef : GraphQLObjectType, provides : any){
        return async (search) => {
            console.log(provides);

            for(var k in search){
                search[k] = (typeDef.getFields()[k].type.toString() == "ID") ?  ObjectId(search[k]) : search[k];
            }
            let query = mapQuery(objectFlip(provides), search)
            let result = await this.client.collection(`${bucket.name}`).findOne(query)
            return mapForward(typeDef, provides, result)
        }
    }

    getAllProvider(bucket, typeDef : GraphQLObjectType, provides){
        return async () => {
            let results = await this.client.collection(`${bucket.name}`).find().toArray()
            return results.map((x) => mapForward(typeDef, provides, x));
        }
    }

    updateProvider(bucket, typeDef : GraphQLObjectType, provides){
        return async(query, obj) => {
            for(var k in query){
                query[k] = (typeDef.getFields()[k].type.toString() == "ID") ? ObjectId(query[k]) : query[k]
            }

            let q = mapQuery(objectFlip(Object.assign({}, provides)), query)
            let inputObject = mapBack(provides, obj)

            for(var key in inputObject){
                if(!inputObject[key]){
                    delete inputObject[key]
                }
            }
            return await this.client.collection(`${bucket.name}`).updateOne(q, {$set: inputObject})
        }
    }

    deleteProvider(bucket, typeDef : GraphQLObjectType, provides){
        return async(id) => {
            this.client.collection(`${bucket.name}`).deleteOne({id: id})
        }
    }

    addProvider(bucket, typeDef : GraphQLObjectType, provides){
        return async(newObject) => {
            let  obj = mapBack(provides, newObject)
            console.log("New object add provider", obj, provides, newObject)
            let newObj = await this.client.collection(`${bucket.name}`).insertOne(obj)
            return mapForward(typeDef, provides, newObj.ops[0])
        }
    }
}
