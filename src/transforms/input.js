const { Transform, mergeSchemas, gql } = require('apollo-server')
const { getDirectives, mapSchema, MapperKind } = require('@graphql-tools/utils')
const { objectValues, compact } = require('./utils.js')
const { GraphQLSchema, GraphQLObjectType, isListType, isNonNullType, GraphQLType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLNamedType, GraphQLString, GraphQLArgument, GraphQLFieldConfigArgumentMap, GraphQLDirective, GraphQLDirectiveConfig, GraphQLInputObjectType } = require('graphql')


function inputTransform (){
    const makeInput = (type) => {
        let fields = {}
        for(var i = 0; i < type.fields.length; i++){
            let newType;
            switch(type.fields[i].type){
                case 'String':
                    newType = GraphQLString
                    break;
                case 'Int':
                    newType = GraphQLInt;
                    break;
            }
            console.log(type.fields[i].astNode.type)
            fields[type.fields[i].name] = {type: type.fields[i].type}
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
                            type: x.type,
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
