const { Transform, mergeSchemas, gql, GraphQLUpload } = require('apollo-server')
const { getDirectives, mapSchema, MapperKind } = require('@graphql-tools/utils')
const { isNativeGraphQLType } = require('./native-symbols')
const { objectValues, compact } = require('./utils')
const { GraphQLSchema, GraphQLObjectType, isListType, GraphQLID, GraphQLBoolean, isNonNullType, GraphQLType, GraphQLList, GraphQLNonNull, GraphQLNamedType, GraphQLString, GraphQLArgument, GraphQLFieldConfigArgumentMap, GraphQLDirective, GraphQLDirectiveConfig, GraphQLInputObjectType } = require('graphql')
const { findTypesWithDirective } = require("../utils")
const { camelCase } =  require("camel-case");
const fileExtension = require('file-extension');

let typeMap;


function uploadTransformer (){
    return {
        uploadTypeDefs: `directive @upload on OBJECT`,
        uploadTransformer: (schema) => {

            let dirs = findTypesWithDirective(schema._typeMap, 'upload')

            let Query = {}
            let Mutation = {}

            let mutationFields = {};
            let queryFields = {};

            for(var i = 0; i < dirs.length; i++){

            
                let args = {}

                const objectName = dirs[i].name;

                const uploadTag = `upload${objectName}`;

                args[camelCase(objectName)] = {type: schema._typeMap[`${objectName}Input`]}
                
                const addTag = `add${objectName}`
                const updateTag = `update${objectName}`
                const deleteTag = `delete${objectName}`

                const getAllTag = `${camelCase(objectName)}s`
                const getTag = `${camelCase(objectName)}`;

                mutationFields[uploadTag] = {
                    type: schema._typeMap[objectName],
                    args: {
                        file: {type: GraphQLUpload}
                    }
                }

                queryFields[getAllTag] = {
                    type: new GraphQLList(schema._typeMap[objectName])
                }

                queryFields[getTag] = {
                    type: schema._typeMap[objectName],
                    args: {
                        id: {type: GraphQLID}
                    }
                }

                Query[getAllTag] = async (parent, _args, context, info) => {
                    //Get all of item
                    return await context.connections.flow.getAll(objectName)
                }

                Query[getTag] = async (parent, {id}, context, info) => {
                    //Get one of item
                    return await context.connections.flow.get(objectName, {id: id});
                }
            
                Mutation[uploadTag] = (parent, args, context) => {
                    //Add one of item
                    return args.file.then(async file => {
                        let stream = file.createReadStream()

                        let ipfsFile = await context.connections.files.upload(file.filename, stream);

                        let files = await context.connections.flow.get(objectName, {filename: file.filename, cid: ipfsFile.cid.toString()})

                        if(files){
                            return {
                                duplicate: true,
                                file: files
                            }
                        }else{
                            let newFile = {
                                cid: ipfsFile.cid.toString(),
                                filename: file.filename,
                                extension: fileExtension(file.filename)
                            }
                            let _file = await context.connections.flow.add(objectName, newFile)
                            
                            return {
                              duplicate: false,
                              file: _file
                            }
                        }
                    })
                }

            }


            let mutation = new GraphQLObjectType({
                name: 'Mutation',
                fields: mutationFields
            })
            
            let query = new GraphQLObjectType({
                name: 'Query',
                fields: queryFields
            })

            let crudSchema = new GraphQLSchema({
                types: [mutation, query],
            })
            
            return mergeSchemas({schemas: [schema, crudSchema], resolvers: [{Mutation, Query}]})
        }
    }
}


module.exports = crudTransformer
