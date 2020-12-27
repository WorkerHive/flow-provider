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

    type MergedType @crud @configurable{
        id: ID
        name: String @input
        description: String @input
        applicationField: String
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
        id: "app:MergedTypes:_id",
        name: "app:MergedTypes:JobName",
        description: "app:MergedType:description",
        applicationField: "app:MergedType:applicationField",
        refs: {
            "id": ["app:MergedType:_id"],
        }
    },
    SensitiveType: {
        name: "app:Sensitive:name",
        sensitiveKey: "app:Sensitive:key",
        refs: {
            "id": ["app:Sensitive:_id"],
        }
    }
}

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

let server = Flow(typeDefs, flowDefs, resolvers)

server.listen({port: 4001}).then((conn) => {
    const {url} = conn;
    console.log(`🚀 Server ready at ${url}`);
})
```

## Type Definitions

Type definitions follow normal GraphQL syntax with the addition of a few directives baked into the flow-provider

### @crud

The crud directive informs the flow provider to set up routes for CRUD operations following the naming convention $operation$TypeName and to setup input types based on the keys in the type with the @input directive

### @configurable

Lets the flow provider know it should allow these types to be configured by flow definitions

### @input

Signals relevant fields to be used for input type setup

## Flow Definitions

Flow definitions are a JSON description of where a model is storing key values and how it should go about retrieving them 

Example 

```
{
    $TypeName: {
        $modelKey: "$store:$pathway:$key",
        $otherKey: "$otherstore:$pathway:$key2"
    }
}

```

