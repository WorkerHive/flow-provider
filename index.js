const { transformSchema, gql, ApolloServer} = require('apollo-server')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const {GraphQLNamedType, GraphQLObjectType, GraphQLType} = require('graphql')

const InputDirective = require('./src/directives/input')
const CRUDDirective = require('./src/directives/crud')
const ConfigurableDirective = require('./src/directives/configurable')

const InputTransform = require('./src/transforms/input')
const ConfigurableTransform = require('./src/transforms/configurable')
const CRUDTransform = require('./src/transforms/crud')

const resolvers = require("./src/resolvers")


const startFlow = (typeDefs) => {
    const { inputTransformTypeDefs, inputTransformTransformer } = InputTransform()
    const { configurableTypeDefs, configurableTransformer } = ConfigurableTransform()
    const { crudTypeDefs, crudTransformer } = CRUDTransform();

    const schema = makeExecutableSchema({
        typeDefs: [inputTransformTypeDefs, configurableTypeDefs, crudTypeDefs, typeDefs],
        resolvers: resolvers(),
        schemaTransforms: [ inputTransformTransformer, configurableTransformer, crudTransformer],
        schemaDirectives: {
            configurable: ConfigurableDirective,
            crud: CRUDDirective,
            input: InputDirective
        }
    })
    const server = new ApolloServer({
        schema: schema,
        schemaDirectives: {
            configurable: ConfigurableDirective,
            crud: CRUDDirective,
            input: InputDirective
        },
        context: {
            connections: {
                flow: {
                    add: () => {},
                    push: () => {},
                    delete: () => {},
                    get: () => {},
                    getAll: () => {},
                }
            }
        }
    })

    return server;
}

module.exports = startFlow

const typeDefs = `

    type Query {
        name: String
    }

    type Mutation {
        setName: String
    }
    
    type Project @crud @configurable{
        id: ID
        name: String @input
        startDate: Int @input
    }

    type User @crud @configurable{
        id: ID
        name: String @input
        email: String @input
        username: String @input
        password: Hash
    }

    type Equipment @crud @configurable{
        id: ID
        name: String @input
        type: String @input
        description: String @input
    }

    type File @configurable {
        id: ID
        filename: String
        extension: String
    }

    type Hash {
        algo: String
        data: String
    }

`


let server = startFlow(typeDefs)

server.listen({port: 4001}).then((conn) => {
    const {url} = conn;
    console.log(`🚀 Server ready at ${url}`);
})
