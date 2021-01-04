
const { ApolloServer, makeExecutableSchema } = require('apollo-server')
const {FlowProvider, MongoStore} = require('..')
const { schemaComposer } = require('graphql-compose');

const typeDefs = `

    type MergedType @crud @configurable {
        id: ID
        name: String @input 
        weirdField: String @input
        description: String @input 
        applicationField: [Hash] 
        unaccountedField: String @input
        upsetField: [String]
    }

    type Project @crud {
        id: ID
        name: String @input
        json: JSON @input
        startDate: Date @input
    }

    type SensitiveType @crud @configurable{
        id: ID
        name: String @input
        description: String @input
        sensitiveKey: [Hash] @input
    }

    type Hash @upload {
        algo: String @input
        data: String @input
    }`

let flowDefs = {
    MergedType: {
        id: "jsis:MergedTypes:_id",
        name: "jsis:MergedTypes:JobName",
        weirdField: "jam:Max:field",
        refs: {
            "id": ["app:MergedType:_id"],
            "name": ["jam:Max:name"]
        }
    },
    SensitiveType: {
        name: "jsis:Sensitive:key",
        sensitiveKey: "app:Sensitive:key",
        refs: {
            "id": ["app:Sensitive:_id", "jsis:Sensitive:_id"],
        }
    }
}

let resolvers = {
    Query: {

    },
    Mutation : {

    }
}

let flowProvider = new FlowProvider(typeDefs, flowDefs, resolvers)

flowProvider.applyInit((opts) => {

    const schema = makeExecutableSchema({
        ...opts.schema,
    })

    return new ApolloServer({
        schema,
        context: opts.context
    })
})

flowProvider.stores.initializeAppStore({url: 'mongodb://localhost', dbName: 'test-db'})

flowProvider.stores.registerStore('jsis', new MongoStore({url: 'mongodb://localhost', dbName: '2nd-test'}))
flowProvider.stores.registerStore('jam', new MongoStore({url: 'mongodb://localhost', dbName: 'jam-jar'}))

flowProvider.server.listen(4002).then((conn) => {
    const {url} = conn;
    console.log(`🚀 Server ready at ${url}`);
})