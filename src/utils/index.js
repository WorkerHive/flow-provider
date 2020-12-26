const { objectValues } = require("../transforms/utils")

const findTypesWithDirective = (typeMap, directive) => {
    let types = objectValues(typeMap)

    return types.filter((type) => {
        return type.astNode && type.astNode.directives
    }).filter((a) => {
        let directives = a.astNode.directives.map((x) => x.name && x.name.value).filter((b) => b)
        return directives.indexOf(directive) > -1
    })
}

const findFieldsWithDirective = (type, directive) => {
    
}

module.exports = {
    findTypesWithDirective
}