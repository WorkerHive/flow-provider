
const { ApolloServer } = require('apollo-server')
const { flow } = require('lodash')
const { FlowFlags } = require('typescript')
const {FlowProvider, MongoStore} = require('..')

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

    type SensitiveType @crud @configurable{
        id: ID
        name: String @input
        description: String @input
        sensitiveKey: Int
    }

    type Hash {
        algo: String
        data: String
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

}

let flowProvider = new FlowProvider(typeDefs, flowDefs, resolvers)

flowProvider.applyInit((opts) => {
    return new ApolloServer(opts)
})

flowProvider.stores.initializeAppStore({url: 'mongodb://localhost', dbName: 'test-db'})

flowProvider.stores.registerStore('jsis', new MongoStore({url: 'mongodb://localhost', dbName: '2nd-test'}))
flowProvider.stores.registerStore('jam', new MongoStore({url: 'mongodb://localhost', dbName: 'jam-jar'}))

flowProvider.server.listen(4002).then((conn) => {
    const {url} = conn;
    console.log(`🚀 Server ready at ${url}`);
})