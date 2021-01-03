const { objectValues } = require("../transforms/utils");
const { objectFlip } = require("../utils/flow-query");

class FlowPath{
    constructor(typeDef, provides){
        this.typeDef = typeDef;
        this.provides = provides;
        this.flow = {};
        this.setupOrDefault();
        this.flipped = objectFlip(this.flow)

    }

    setupOrDefault(){
        let typeDef = this.typeDef.astNode;
        console.log("Setup Default", typeDef);
        for(var k in typeDef.fields){
            let key = typeDef.fields[k].name.value;

            
            if(this.provides[key]){
                this.flow[key] = this.provides[key]
            }else{
                let type = typeDef.fields[k].type.kind == "NamedType" ? typeDef.fields[k].type.name.value : typeDef.fields[k].type.type.name.value
                if(type == "ID") {
                    this.flow[key] = `app:${this.typeDef.name}:_id`;
                }else{
                    this.flow[key] = `app:${this.typeDef.name}:${key}`
                }
                
            }
        }
    }

    getBatched(){
        console.log(this.flow, this.provides)
        let paths = objectValues(this.flow).map((x) => x.split(':'))

        let accumulator = {};
         paths.forEach((current) => {
            if(!accumulator) accumulator = {}
            if(!accumulator[current[0]]) accumulator[current[0]] = {}
            if(!accumulator[current[0]][current[1]]) accumulator[current[0]][current[1]] = {}
            accumulator[current[0]][current[1]][current[2]] = this.flipped[current.join(':')]
            
        })

        accumulator['refs'] = this.provides['refs']
        console.log(accumulator)
        return accumulator;
    }


}

module.exports = FlowPath;