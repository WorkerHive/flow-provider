import sql from 'mssql';
import SQLAdapter from '../adapters/mssql';
import BaseStore from './base.js';
import async from 'async';

export default class MSSQLStore extends BaseStore {
    public static type: String = "mssql";
    public static storeName: String = 'MSSQL';
    public static description: String = "Microsoft SQL Server";


    public db: any;
    public adapter : SQLAdapter;

    constructor(config){
        super(config);
        console.log("=> Connecting to MSSQL Store", JSON.stringify(config))
        this.setup();
    }

    getAdapter(){
        return new SQLAdapter()
    }

    async setup(){
        console.log(this.config)
        let dbConfig = {
            user: this.config.user,
            password: this.config.pass,
            server: this.config.host,
        }

        if(this.config.dbName){
            dbConfig['database'] = this.config.dbName
        }
        this.db = await sql.connect(dbConfig);
        this.adapter = new SQLAdapter()

        let layout = await this.layout();
        console.log(layout);
    }
    
    async getBucketGroups(){
        let result = await this.adapter.request({}, 'SELECT name FROM master.dbo.sysdatabases');
        
        console.log("Bucket Groups", result);
    }

    async layout(){
        
        return new Promise((resolve, reject) => {
            async.parallel([(cb) => {
                let request = new sql.Request();
                request.query('SELECT * FROM sys.Tables', cb)
            }, (cb) => {
                let request = new sql.Request();
                request.query('SELECT * FROM sys.Views', cb)
            }], (err, data) => {
                console.log(err, data);
                if(err) return reject(err);
                return resolve(data.map((x) => x.recordset).reduce((a, b) => a.concat(b)))
            })
        })
        
    }
    async bucketLayout(bucketName){

        let request = new sql.Request();
        request.input('tableName', sql.VarChar, bucketName);
        let result = await request.query('SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME=@tableName')

        return result.recordset.map((x) => ({
            name: x.COLUMN_NAME,
            datatype: x.DATA_TYPE
        }))

    }  
    
}
