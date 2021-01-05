import { NamedTypeComposer, ObjectTypeComposer } from "graphql-compose";
import { GraphQLNamedType } from "graphql-compose/lib/graphql";

const { objectValues } = require("../transforms/utils");
const { objectFlip } = require("../utils/flow-query");

export default class FlowPath{

    public typeDef : ObjectTypeComposer<any>;
    public provides: any;
    private flow : any;
    private flipped: any;

    constructor(typeDef : ObjectTypeComposer<any>, provides : any){
        this.typeDef = typeDef;
        this.provides = provides;
        this.flow = {};
        this.setupOrDefault();
        this.flipped = objectFlip(this.flow)

    }

    setupOrDefault(){

        let fields = this.typeDef.getFields() 
        for(var k in fields){

            let field = fields[k].astNode;
            
            let key = field.name.value;

            
            if(this.provides[key]){
                this.flow[key] = this.provides[key]
            }else{
                let type;
                if(field.type.kind == "NamedType"){
                    type = field.type.name.value;
                }else if(field.type.kind == "ListType"){
                    type = JSON.parse(JSON.stringify(field.type.type)).name.value;
                }

                if(type == "ID") {
                    this.flow[key] = `app:${this.typeDef.getTypeName()}:_id`;
                }else{
                    this.flow[key] = `app:${this.typeDef.getTypeName()}:${key}`
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

