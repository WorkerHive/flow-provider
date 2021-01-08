export default class BaseStore {

    public static storeName: String;
    public static type: String;
    public static description: String;
    
    public config : any;

    constructor(config){
        this.config = config;
    }

    getAdapter(){

    }

    setup(){

    }

    start(){

    }

    stop(){

    }

    isAlive(){

    }
}
