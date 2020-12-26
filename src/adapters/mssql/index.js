const BaseAdapter = require("../base-adapter");
const { getFields, mapForward, mapQuery, objectFlip } = require('../../utils/flow-query')
const sql = require('mssql');
const { camelCase } = require("camel-case");

class MSSQLAdapter extends BaseAdapter{

    getType(type){
        console.log("Type", type)
        switch(type){
            case 'String':
                return sql.NVarChar;
            case 'Int':
                return sql.Int;
            case 'Float':
                return sql.Float;
            case 'Boolean':
                return sql.Bit;
            default:
                console.log("No type found for", type)
                return null;
        }
    }

    deleteProvider(bucket, typeDef, provides){
        return async (id) => {
            let request = new sql.Request();

            request.input('id', sql.VarChar, id)
            let idKey = "ID"

            let sqlQuery = `DELETE FROM ${bucket.name} WHERE ${idKey}=@id`
        }
    }
    
    addProvider(bucket, typeDef, provides){
        let { fields, empty } = getFields(provides)
        let flippedProvider = objectFlip(provides)

        return async (newObject) => {
            let query = mapForward(provides, newObject)

            let request = new sql.Request();
            let insertKeys = [];
            let valueKeys = [];
    
            fields.forEach((value, index) => {
                console.log(value, flippedProvider, typeDef.astNode.fields)
                let vKey = camelCase(value)
                let qKey = typeDef.astNode.fields.filter((a) => a.name.value == flippedProvider[value])[0]
                
                console.log(qKey.type.name.value, query[value])
                request.input(vKey, this.getType(qKey.type.name.value), query[value])
                insertKeys.push(value)
                valueKeys.push(vKey)
            })
    
            let sqlQuery = `INSERT INTO ${bucket.name} (${insertKeys.join(', ')}) VALUES (${valueKeys.map((x) => "@"+x).join(', ')})`
            
            console.log(sqlQuery)
            //request.query(sql)
        }
    }

    updateProvider(bucket, typeDef, provides){
        let { fields, empty } = getFields(provides);
        const flippedProvider = objectFlip(provides)
        
        return async (id, update) => {
            let query = mapQuery(provides, update)

            let request = new sql.Request();

            let valuePairs = [];

            for(var k in query){
                let vKey = camelCase(k)
                let qKey = typeDef.astNode.fields.filter((a) => a.name.value == flippedProvider[k])[0]
                
                request.input(vKey, this.getType(qKey.type.name.value), query[k])
                valuePairs.push(`${k}=@${vKey}`)
            }
            
            let idKey = "ID"; //TODO find cross iD links

            let sqlQuery = `UPDATE ${bucket.name} SET ${valuePairs.join(', ')} WHERE ${idKey}=@id`
        }
    }

    getProvider(bucket, typeDef, provides){
        let {fields, empty} = getFields(provides)

        let query = `SELECT ${fields.join(', ')} FROM ${bucket.name}`;
        return async (search) => {
            console.log(search, query)
        }
    }
}

module.exports = MSSQLAdapter;