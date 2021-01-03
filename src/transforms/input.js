const { Transform, mergeSchemas, gql } = require('apollo-server')
const { getDirectives, mapSchema, MapperKind } = require('@graphql-tools/utils')
const { objectValues, compact } = require('./utils.js')
const { GraphQLSchema, GraphQLBoolean, GraphQLFloat, GraphQLObjectType, isListType, isNonNullType, GraphQLType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLNamedType, GraphQLString, GraphQLArgument, GraphQLFieldConfigArgumentMap, GraphQLDirective, GraphQLDirectiveConfig, GraphQLInputObjectType } = require('graphql')


function inputTransform (){

    const isNativeType = (type) => {
        switch(type.name.value){
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

    const makeFields = (types, fields) => {
        let outputTypes = types.slice();
        fields.forEach(type => {
            let outputFields = {}

            for(var i = 0; i < type.fields.length; i++){
                let newType;
                if(type.fields[i].type.kind == "NamedType"){
                    if(isNativeType(type.fields[i]) != null){
                        newType = isNativeType(type.fields[i].type)
                    }else{
                        newType = types.filter((a) => a.name == type.fields[i].type.name.value)[0]
                    }
                    
                }else if(type.fields[i].type.kind == "ListType"){
                    if(isNativeType(type.fields[i].type) != null){
                        newType = isNativeType(type.fields[i].type.type);
                    }else{
                        newType = types.filter((a) => a.name == type.fields[i].type.type.name.value)[0]
                    }
                    
                    newType = new GraphQLList(newType)
                }

                outputFields[type.fields[i].name] = {type: newType};
                console.log(fields)
            }

            let ix = outputTypes.map((x) => x.name).indexOf(type.name)
            outputTypes[ix].fields = outputFields;
        })
        return outputTypes
    }

    const makeInput = (type) => {
      
        return new GraphQLInputObjectType({
            name: type.name,
            fields: {}
        })
    }

    return {
        inputTransformTypeDefs: `directive @input on OBJECT | FIELD_DEFINITION `,
        inputTransformTransformer: (schema, fieldSet) => {

            let types = objectValues(schema._typeMap).filter((a) => a instanceof GraphQLObjectType).map((x) => ({
                ...x,
                fields: objectValues(x.getFields()) 
            }))
            
            types = types.filter((a) => {
                let fieldDirectives = a.fields
                    .filter((a) => a.astNode)
                    .map((x) =>{
                       return x.astNode.directives
                    }).map((x) => {
                    return x.map(y => y.name && y.name.value)
                    }).map((x) => x.map((y) => y == 'input').indexOf(true) > -1)

                    return fieldDirectives.indexOf(true) > -1
            })
            
            let inputFields = types.map((x) => {
                return {
                    name: `${x.name}Input`,
                    fields: x.fields.filter((a) => a.astNode).map((x) => {
                        return {
                            name: x.name,
                            type: x.astNode.type,
                            directives: x.astNode.directives
                        }
                    }).filter((a) => a.directives.map((x) => x.name && x.name.value).indexOf('input') > -1)
                }
            })

            let newTypes = inputFields.map(makeInput)
            newTypes = makeFields(newTypes, inputFields)
          
            let _schema = new GraphQLSchema({
                types: newTypes
            })
            
            return mergeSchemas({schemas:[schema, _schema]})
        }
    }
}


module.exports = inputTransform
/*{
    transformSchema: (schema: any) => console.log("SCHEMA", schema)
}*/
