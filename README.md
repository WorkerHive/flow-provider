# ![Workhub Logo](https://raw.githubusercontent.com/WorkerHive/flow-provider/master/logo.png) Workhub Flow Provider

Connecting all the pipes together to make a big beautiful graph that can be searched with graphql

- Auto CRUD with GraphQL Directives
- Define input types from your type defintiions
- Configurable decorator for objects allowing user defined resolvers

## Usage

The following snippet generates an apollo-server configured with a SensitiveType and a Hash no resolvers are set up for the hash but the SensitiveType will now have resolvers for 

- sensitivetypes: [SensitiveType]
- sensitivetype(id: ID): SensitiveType
- addSensitiveType(sensitivetype: SensitiveTypeInput) : SensitiveType
- updateSensitiveType(id: ID, sensitivetype: SensitiveTypeInput) : SensitiveType
- deleteSensitiveType(id: ID): Boolean

these will be routed by default to the app store provided, if the configurable directive has been set the user can choose which store they would like to use


```
const Flow = require('@workerhive/flow-provider')

const typeDefs = `
    type Query {
        //All extra queries can be defined here
    }

    type Mutation{
        //All extra mutations can be defined here
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

let server = Flow(typeDefs)

server.listen({port: 4001}).then((conn) => {
    const {url} = conn;
    console.log(`🚀 Server ready at ${url}`);
})
```
