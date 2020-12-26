# <img src="https://raw.githubusercontent.com/WorkerHive/flow-provider/master/logo.png" alt="Workhub Logo" width="150"/> Workhub Flow Provider

Connecting all the pipes together to make a big beautiful graph that can be searched with graphql

- Auto CRUD with GraphQL Directives
- Define input types from your type defintiions
- Configurable decorator for objects allowing user defined resolvers

## Usage

The following snippet generates an apollo-server configured with a SensitiveType and a Hash no resolvers are set up for the hash but the SensitiveType will now have resolvers for 

- sensitiveTypes: [SensitiveType]
- sensitiveType(id: ID): SensitiveType
- addSensitiveType(sensitiveType: SensitiveTypeInput) : SensitiveType
- updateSensitiveType(id: ID, sensitiveType: SensitiveTypeInput) : SensitiveType
- deleteSensitiveType(id: ID): Boolean

these will be routed by default to the app store provided, if the configurable directive has been set the user can choose which store they would like to use


```
const Flow = require('@workerhive/flow-provider')

const typeDefs = `
    type Query {
        //All extra queries can be defined here e.g.
        getHashes: [Hash]
    }

    type Mutation{
        //All extra mutations can be defined here e.g.
        hash(content: String): Hash
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

let resolvers = {
    Query: {
        getHashes: (parent, args, context) => {

        }
    },
    Mutation: {
        hash: (parent, {content}, context) => {

        }
    }
}

let server = Flow(typeDefs, resolvers)

server.listen({port: 4001}).then((conn) => {
    const {url} = conn;
    console.log(`🚀 Server ready at ${url}`);
})
```
