import { getDirectives, mapSchema, MapperKind } from '@graphql-tools/utils'
import { isNativeGraphQLType } from './native-symbols'
import { objectValues, compact } from './utils'
import { GraphQLObjectType, isListType, GraphQLID, GraphQLBoolean, isNonNullType, GraphQLType, GraphQLList, GraphQLNonNull, GraphQLNamedType, GraphQLString, GraphQLArgument, GraphQLFieldConfigArgumentMap, GraphQLDirective, GraphQLDirectiveConfig, GraphQLInputObjectType } from 'graphql'
import { findTypesWithDirective } from "../utils"
import { camelCase } from "camel-case";
import fileExtension from 'file-extension'
import { NamedTypeComposer, SchemaComposer, schemaComposer }  from 'graphql-compose'

let typeMap;


export default function uploadTransformer (){
    return {
        uploadTypeDefs: `directive @upload on OBJECT`,
        uploadTransformer: (schema : SchemaComposer<any>) => {

            schemaComposer.merge(schema);

            let dirs : Array<NamedTypeComposer<any>> = findTypesWithDirective(schema.types, 'upload')

            let Query = {}
            let Mutation = {}

            let mutationFields = {};
            let queryFields = {};

            for(var i = 0; i < dirs.length; i++){

                let type = dirs[i];

                let args = {}

                const objectName = type.getTypeName();

                const uploadTag = `upload${objectName}`;

                args[camelCase(objectName)] = `${objectName}Input`

                const getAllTag = `${camelCase(objectName)}s`
                const getTag = `${camelCase(objectName)}`;

                schemaComposer.Mutation.addFields({
                    [uploadTag]:{
                        type: objectName,
                        args: {
                            file: 'Upload' 
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
                        type: `[${objectName}]`,
                        resolve: async (parent, _args, context, info) => {
                            //Get all of item
                            return await context.connections.flow.getAll(objectName)
                        }
                    },
                    [getTag]:{
                        type: objectName,
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


