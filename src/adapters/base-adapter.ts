import { ObjectTypeComposer } from "graphql-compose";
import { GraphQLObjectType } from "graphql-compose/lib/graphql";

export default class BaseAdapter {

    public type: GraphQLObjectType;
    public storeList: any;
    public paths: any;

    updateProvider(bucket, typeDef, provides){

    }

    deleteProvider(bucket, typeDef, provides){

    }

    addProvider(bucket, typeDef, provides){

    }

    getProvider(bucket, typeDef, provides){

    }

    getAllProvider(bucket, typeDef, provides){

    }
}

module.exports = BaseAdapter;