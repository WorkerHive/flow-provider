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
        for(var k in this.typeDef._fields){
            if(this.provides[k]){
                this.flow[k] = this.provides[k]
            }else{
                console.log(this.typeDef._fields[k])
                if(this.typeDef._fields[k].type == "ID") {
                    this.flow[k] = `app:${this.typeDef.name}:_id`;
                }else{
                    this.flow[k] = `app:${this.typeDef.name}:${k}`
                }
                
            }
        }
    }

    getBatched(){

        let paths = objectValues(this.flow).map((x) => x.split(':'))

        let accumulator = {};
         paths.forEach((current) => {
            if(!accumulator) accumulator = {}
            if(!accumulator[current[0]]) accumulator[current[0]] = {}
            if(!accumulator[current[0]][current[1]]) accumulator[current[0]][current[1]] = {}
            accumulator[current[0]][current[1]][current[2]] = this.flipped[current.join(':')]
            
        })
        return accumulator;
    }


}

module.exports = FlowPath;