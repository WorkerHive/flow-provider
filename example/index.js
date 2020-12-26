
const { FlowFlags } = require('typescript')
const {FlowProvider, MongoStore} = require('..')

const typeDefs = `

    type MergedType @crud @configurable {
        id: ID
        name: String @input 
        description: String @input 
        applicationField: [Hash] 
        unaccountedField: String
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
        id: "jsis:MergedTypes:JobID",
        name: "jsis:MergedTypes:JobName",
        description: "app:MergedType:description",
        applicationField: "app:MergedType:applicationField"
    },
    SensitiveType: {
        name: "jsis:Sensitive:key",
        sensitiveKey: "app:Sensitive:key"
    }
}

let resolvers = {

}

let server = new FlowProvider(typeDefs, flowDefs, resolvers)

server.initializeAppStore({url: 'mongodb://localhost', dbName: 'test-db'})

server.registerStore('jsis', 'mongodb', new MongoStore({url: 'mongodb://localhost', dbName: '2nd-test'}))

server.startServer(4001).then((conn) => {
    const {url} = conn;
    console.log(`🚀 Server ready at ${url}`);
})