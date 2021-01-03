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
            console.log(k, typeDef.fields[k])
            if(this.provides[k]){
                this.flow[k] = this.provides[k]
            }else{
                if(typeDef.fields[k].type.name.value == "ID") {
                    this.flow[k] = `app:${this.typeDef.name}:_id`;
                }else{
                    this.flow[k] = `app:${this.typeDef.name}:${k}`
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