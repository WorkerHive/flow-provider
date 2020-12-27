
const { FlowFlags } = require('typescript')
const {FlowProvider, MongoStore} = require('..')

const typeDefs = `

    type MergedType @crud @configurable {
        id: ID
        name: String @input 
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
        refs: {
            "id": ["app:MergedType:_id"],
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

let server = new FlowProvider(typeDefs, flowDefs, resolvers)

server.stores.initializeAppStore({url: 'mongodb://localhost', dbName: 'test-db'})

server.stores.registerStore('jsis', new MongoStore({url: 'mongodb://localhost', dbName: '2nd-test'}))

server.startServer(4002).then((conn) => {
    const {url} = conn;
    console.log(`🚀 Server ready at ${url}`);
})