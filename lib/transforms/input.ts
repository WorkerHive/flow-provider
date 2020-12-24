import { Transform } from 'apollo-server';
import { GraphQLSchema, GraphQLType, GraphQLList, GraphQLNonNull, GraphQLNamedType, GraphQLString, GraphQLArgument, GraphQLFieldConfigArgumentMap, GraphQLDirective, GraphQLDirectiveConfig, GraphQLInputObjectType } from 'graphql';

class InputTransform implements Transform {
    private mapType<T extends GraphQLType>(type: T): T {
        if (isListType(type)) {
            return <T>new GraphQLList(this.mapType(type.ofType));
        }
        if (isNonNullType(type)) {
            return <T>new GraphQLNonNull(this.mapType(type.ofType));
        }
        const namedType = <GraphQLNamedType>type; // generics seem to throw off type guard logic
        if (isNativeGraphQLType(namedType)) {
            // do not rename native types but keep the reference to singleton objects like GraphQLString
            return type;
        }
        return <T>this.findType(namedType.name);
    }

    private transformArguments(originalArgs: GraphQLArgument[]): GraphQLFieldConfigArgumentMap {
        const args: GraphQLFieldConfigArgumentMap = {};
        for (const arg of originalArgs) {
            args[arg.name] = {
                description: arg.description,
                type: this.mapType(arg.type),
                defaultValue: arg.defaultValue,
                astNode: arg.astNode
            };
        }
        return args;
    }
    
    transformSchema(schema: GraphQLSchema) : GraphQLSchema {
        
        let typeMap = schema.getTypeMap()

        let directives = schema.getDirectives().map((x: GraphQLDirective) => new GraphQLDirective({
            name: x.name,
            description: x.description,
            locations: x.locations,
            args: x.args,
            astNode: x.astNode
        }))

        let query = schema.getQueryType()
        let mutation = schema.getMutationType()
        let subscription = schema.getSubscriptionType()
        let rootTypes = compact([query, mutation, subscription])
        let objectTypes = objectValues(typeMap)

        return new GraphQLSchema({
            directives,
            query,
            mutation,
            subscription,
            types: typeMap
        })

        schema.getTypeMap(). ['TestInput'] = new GraphQLInputObjectType({
            name: 'TestInput',
            fields: {
                id: { type : GraphQLString}
            }
        })
        return schema;
    }
}
module.exports = InputTransform
/*{
    transformSchema: (schema: any) => console.log("SCHEMA", schema)
}*/
