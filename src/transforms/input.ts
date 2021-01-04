import { Transform, mergeSchemas, gql } from 'apollo-server'
import { getDirectives, mapSchema, MapperKind } from '@graphql-tools/utils'
import { objectValues, compact } from './utils.js'
import { GraphQLSchema, GraphQLBoolean, GraphQLFloat, GraphQLObjectType, isListType, isNonNullType, GraphQLType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLNamedType, GraphQLString, GraphQLArgument, GraphQLFieldConfigArgumentMap, GraphQLDirective, GraphQLDirectiveConfig, GraphQLInputObjectType, GraphQLID } from 'graphql'
import { SchemaComposer, schemaComposer }  from 'graphql-compose';

export default function inputTransform (){

    const isNativeType = (type) => {
        switch(type){
            case "JSON":
                return "JSON"
            case "Date":
                return "Date";
            case "ID":
                return GraphQLID;
            case "String":
                return GraphQLString;
            case "Int":
                return GraphQLInt;
            case "Float":
                return GraphQLFloat;
            case "Boolean":
                return GraphQLBoolean;
            default:
                return null;
        }
    }

    const makeRefFields = (types, fields) => {
        let outputTypes = types.slice();
        fields.forEach(type => {
            let outputFields = {}

            for(var i = 0; i < type.fields.length; i++){
                let newType;
                if(type.fields[i].type.kind == "NamedType"){
                    if(isNativeType(type.fields[i].type) != null){
                       
                    }else{
                        newType = types.filter((a) => a.name == `${type.fields[i].type.name.value}Input`)[0]
                    }
                    
                }else if(type.fields[i].type.kind == "ListType"){
                    if(isNativeType(type.fields[i].type.type) != null){
                      
                    }else{
                       // console.log(types, type.fields[i].type.type.name.value);
                        newType = types.filter((a) => a.name == `${type.fields[i].type.type.name.value}Input`)[0]
                    }
                    
                    newType = new GraphQLList(newType)
                }

                outputFields[type.fields[i].name] = {type: newType};
                console.log(fields)
            }

            let ix = outputTypes.map((x) => x.name).indexOf(type.name)
            let config = outputTypes[ix].toConfig();
            outputTypes[ix] = new GraphQLInputObjectType({
                ...config,
                fields: {
                    ...config.fields,
                    fields: outputFields
                }
            })
        })
        return outputTypes
    }

    const convertInput = (type) => {
        let outputFields = {};

            let newType;
            if(!type.match(/\[(.*?)\]/)){
                if(isNativeType(type) != null){
                    newType = type
                }else{
                    newType = `${type}Input`
                }
                
            }else{
                let arrType = type.match(/\[(.*?)\]/)[1];

                if(isNativeType(arrType) != null){
                    newType = `[${arrType}]`;
                }else{
                    newType = `[${arrType}Input]`
                }
                

            }
            return newType;

    }

    return {
        inputTypeDefs: `directive @input on OBJECT | FIELD_DEFINITION `,
        inputTransformer: (schema : SchemaComposer<any>) => {
            
            schemaComposer.merge(schema)

            let types = [];
            if(!schema.types) console.log(schema);
            schemaComposer.types.forEach((val, key, map) => {
                if(typeof(key) == 'string'){
                    if(schemaComposer.isObjectType(key)){
                        let obj = schema.getOTC(key)
                        let _fields = obj.getFields();
                        let fields = [];
                        for(var k in _fields){
                            fields.push({
                                name: k,
                                type: _fields[k].type.getTypeName(),
                                directives: obj.getFieldDirectives(k).map((x) => x.name)
                            })
                        }
                        types.push({ 
                            name: key, 
                            fields: fields
                        })
                    }
                }
            })

        

            types = types.filter((a) => a.fields.map((x) => x.directives.indexOf('input') > -1).indexOf(true) > - 1);
            console.log("INPUT TYPES", JSON.stringify(types));

            let newTypes = types.map((x) => {
                
                    let inputType = `
                    input ${x.name}Input{
                        ${x.fields.filter((a) => a.directives.indexOf('input') > -1).map((x) => {
                            let type = `${x.name} : ${convertInput(x.type)}`
                            if(x.directives) type += " " + x.directives.map((x) => `@${x}`).join(' ')
                            return type;
                        }).join(`\n`)}
                    }   
                    `

                    let fields = {};
                    x.fields.filter((a) => a.directives.indexOf('input') > -1).forEach((field) => {
                        fields[field.name] = {
                            type: convertInput(field.type),
                            directives: field.directives
                        }
                    })

                    return schemaComposer.createInputTC({
                        name: `${x.name}Input`,
                        fields: fields
                    })


            })
 
           return newTypes;
        }
    }
}

