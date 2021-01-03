const { Transform, mergeSchemas, gql } = require('apollo-server')
const { getDirectives, mapSchema, MapperKind } = require('@graphql-tools/utils')
const { objectValues, compact } = require('./utils.js')
const { GraphQLSchema, GraphQLObjectType, isListType, isNonNullType, GraphQLType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLNamedType, GraphQLString, GraphQLArgument, GraphQLFieldConfigArgumentMap, GraphQLDirective, GraphQLDirectiveConfig, GraphQLInputObjectType } = require('graphql')


function inputTransform (){
    const makeInput = (type) => {
        let fields = {}
        for(var i = 0; i < type.fields.length; i++){
            let newType;
            if(type.fields[i].type.kind == "NamedType"){
                newType = Object.assign({}, type.fields[i].type)
                
            }else if(type.fields[i].type.kind == "ListType"){
                newType = Object.assign({}, type.fields[i].type);
                
                switch(type.fields[i].type.type.name.value){
                    case "String":
                    case "Int":
                    case "Boolean":
                    case "Float":
                        
                        break
                    default:
                        newType.type.name.value = `${newType.type.name.value}Input`
                        break;
                }

            }

            fields[type.fields[i].name] = newType;
            console.log(fields)
        }
        return new GraphQLInputObjectType({
            name: type.name,
            fields: fields
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
