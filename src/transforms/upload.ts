import { Transform, mergeSchemas, gql, GraphQLUpload } from 'apollo-server'
import { getDirectives, mapSchema, MapperKind } from '@graphql-tools/utils'
import { isNativeGraphQLType } from './native-symbols'
import { objectValues, compact } from './utils'
import { GraphQLObjectType, isListType, GraphQLID, GraphQLBoolean, isNonNullType, GraphQLType, GraphQLList, GraphQLNonNull, GraphQLNamedType, GraphQLString, GraphQLArgument, GraphQLFieldConfigArgumentMap, GraphQLDirective, GraphQLDirectiveConfig, GraphQLInputObjectType } from 'graphql'
import { findTypesWithDirective } from "../utils"
import { camelCase } from "camel-case";
import fileExtension from 'file-extension'
import { schemaComposer }  from 'graphql-compose'

let typeMap;


export default function uploadTransformer (){
    return {
        uploadTypeDefs: `directive @upload on OBJECT`,
        uploadTransformer: (schema) => {

            console.log(schema);

            schemaComposer.merge(schema);

            let dirs = findTypesWithDirective(schema.getTypeMap(), 'upload')

            let Query = {}
            let Mutation = {}

            let mutationFields = {};
            let queryFields = {};

            for(var i = 0; i < dirs.length; i++){

                let typeMap = schema.getTypeMap();

                let args = {}

                const objectName = dirs[i].name;

                const uploadTag = `upload${objectName}`;

                args[camelCase(objectName)] = {type: schema.getTypeMap()[`${objectName}Input`]}

                const getAllTag = `${camelCase(objectName)}s`
                const getTag = `${camelCase(objectName)}`;

                schemaComposer.Mutation.addFields({
                    [uploadTag]:{
                        type: typeMap[objectName].toString(),
                        args: {
                            file: {type: GraphQLUpload}
                        },
                        resolve: (parent, args, context) => {
                            //Add one of item
                            return args.file.then(async file => {
                                let stream = file.createReadStream()
        
                                let ipfsFile = await context.connections.files.upload(file.filename, stream);
        
                                let files = await context.connections.flow.get(objectName, {filename: file.filename, cid: ipfsFile.cid.toString()})
        
                                if(files){
                                    return files;
                                }else{
                                    let newFile = {
                                        cid: ipfsFile.cid.toString(),
                                        filename: file.filename,
                                        extension: fileExtension(file.filename)
                                    }
                                    let _file = await context.connections.flow.add(objectName, newFile)
                                    
                                    return _file;
                                }
                            })
                        }
                    }
                })

                schemaComposer.Query.addFields({
                    [getAllTag]:{
                        type: new GraphQLList(schema.getTypeMap()[objectName]),
                        resolve: async (parent, _args, context, info) => {
                            //Get all of item
                            return await context.connections.flow.getAll(objectName)
                        }
                    },
                    [getTag]:{
                        type: typeMap[objectName].toString(),
                        args: {
                            id: {type:GraphQLID}
                        },
                        resolve:  async (parent, {id}, context, info) => {
                            //Get one of item
                            return await context.connections.flow.get(objectName, {id: id});
                        }
                    }
                })

            

            }

            
            return schemaComposer.buildSchema(); 
        }
    }
}


