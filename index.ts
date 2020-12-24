import { makeExecutableSchema, transformSchema, gql, ApolloServer } from "apollo-server";
const ConfigurableDirective = require('./lib/directives/configurable')
const InputDirective = require('./lib/directives/input')
const InputTransform = require('./lib/transforms/input')
const resolvers = require("./lib/resolvers")


const typeDefs = gql`
    directive @configurable on OBJECT | FIELD_DEFINITION 
    directive @input on FIELD_DEFINITION

    extend type __Type{
        isConfigurable: Boolean
    }

    extend type __Field {
        fieldName: String
        isConfigurable: Boolean
    }

    type Query {
        name: String
    }

    type Mutation {
        setName: String
    }
    
    type Project {
        id: ID
        name: String @input
        startDate: Int @input
    }

    type TestDe @configurable{
        new: String
    }

    type Example{
        new: String @configurable 
        old: String @configurable
    }
`

//console.log(typeDefs.definitions.filter((a : any) => a.kind=="ObjectTypeDefinition").map((x: any) => x))

const schema = makeExecutableSchema({
    typeDefs,
    resolvers: resolvers(),
    schemaDirectives: {
        configurable: ConfigurableDirective,
        input: InputDirective
    }
})

const transformed = transformSchema(schema, [
    new InputTransform()
])

const server = new ApolloServer({schema: transformed})

//let configurable = []

/*
for(var k in server.schema._typeMap){
    configurable.push(server.schema._typeMap[k])
}*/

/*

configurable = configurable.filter((a:any) => a.isConfigurable == true)

let types = configurable.map((x: any) => x.getFields()).map((x : any) => {
    console.log(x)
    let fields = []
    for(var k in x){
        fields.push({name: x[k].name, type: x[k].type, isConfigurable: x[k].isConfigurable})
    }
    return fields;
})*/


server.listen().then((conn : any) : void => {
    const {url} = conn;
    console.log(`🚀 Server ready at ${url}`);
})