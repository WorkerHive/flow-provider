import sql from 'mssql';
import SQLAdapter from '../adapters/mssql.js';
import BaseStore from './base.js';

class MSSQLStore extends BaseStore {
    async constructor(config){
        super();
        console.log("=> Connecting to MSSQL Store", JSON.stringify(config))
        this.db = await sql.connect(config)
        this.adapter = SQLAdapter(db)
    }


    
    async layout(){
        
            let tables = await adapter.request([], `SELECT * FROM sys.Tables`)
            let views = await adapter.request([], `SELECT * FROM sys.Views`)

            return views.recordset.concat(tables.recordset)
    }
    async bucketLayout(bucketName){
            let info = await adapter.request([
                {
                    type: sql.VarChar,
                    key: 'tableName',
                    value: bucketName
                }
            ], `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME=@tableName`)
            return info.recordset.map((x) => ({
                name: x.COLUMN_NAME,
                datatype: x.DATA_TYPE
              }))
    }  
    
}

MSSQLStore.type = "mssql";

module.exports = MSSQLStore;
