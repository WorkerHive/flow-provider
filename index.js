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


const startFlow = (typeDefs, userResolvers) => {
    const { inputTransformTypeDefs, inputTransformTransformer } = InputTransform()
    const { configurableTypeDefs, configurableTransformer } = ConfigurableTransform()
    const { crudTypeDefs, crudTransformer } = CRUDTransform();

    const schema = makeExecutableSchema({
        typeDefs: [inputTransformTypeDefs, configurableTypeDefs, crudTypeDefs, typeDefs],
        resolvers: [resolvers(), userResolvers],
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
