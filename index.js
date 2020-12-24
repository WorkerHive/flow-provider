const { transformSchema, gql, ApolloServer} = require('apollo-server')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const {GraphQLNamedType, GraphQLObjectType, GraphQLType} = require('graphql')
const ConfigurableDirective = require('./src/directives/configurable')
const InputTransform = require('./src/transforms/input')
const resolvers = require("./src/resolvers")


const typeDefs = gql`
    directive @configurable on OBJECT

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
        new: String 
        old: String 
    }
`

//console.log(typeDefs.definitions.filter((a : any) => a.kind=="ObjectTypeDefinition").map((x: any) => x))
 
const {inputTransformTypeDefs, inputTransformTransformer} = InputTransform()

const schema = makeExecutableSchema({
    typeDefs: [inputTransformTypeDefs, typeDefs],
    resolvers: resolvers(),
    schemaTransforms: [ inputTransformTransformer ],
    schemaDirectives: {
        configurable: ConfigurableDirective
    }
})


const server = new ApolloServer({schema: schema, schemaDirectives: {
    configurable: ConfigurableDirective,
}})

let configurable = []


for(var k in server.schema._typeMap){
    configurable.push(server.schema._typeMap[k])
}


configurable = configurable.filter((a) => a.isConfigurable == true)

let types = configurable.map((x) => x.getFields()).map((x) => {
    console.log(x)
    let fields = []
    for(var k in x){
        fields.push({name: x[k].name, type: x[k].type, isConfigurable: x[k].isConfigurable})
    }
    return fields;
})

console.log(configurable)

server.listen({port: 4001}).then((conn) => {
    const {url} = conn;
    console.log(`🚀 Server ready at ${url}`);
})