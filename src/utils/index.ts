import { NamedTypeComposer, TypeStorage } from "graphql-compose";

const { objectValues } = require("../transforms/utils")

export const findTypesWithDirective = (typeMap : Map<any, NamedTypeComposer<any>>, directive) : Array<NamedTypeComposer<any>> => {
    let types : Array<NamedTypeComposer<any>> = [];
    console.log(typeMap.size)
    typeMap.forEach((val, key) => {
        if(typeof(key) == 'string'){
            console.log(val.getDirectives())
            if(val.getDirectives().map((x) => x.name).indexOf(directive) > -1){
                types.push(val);
            }
        }
    })

    return types;
}

const findFieldsWithDirective = (type, directive) => {
    
}

