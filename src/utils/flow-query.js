const { objectValues } = require('../transforms/utils')
const getFields = (spec) => {
    let fields = [];
    let empty = [];
    for(var k in spec){
        if(spec[k]){
            fields.push(spec[k])
        }else{
            empty.push(k)
        }
    }
    return { fields, empty }
}

const objectFlip = (obj) => {
    const ret = {};
    Object.keys(obj).forEach(key => {
      ret[obj[key]] = key;
    });
    return ret;
  }

  const mapQuery = (spec, query) => {
      console.log(spec, query)
    let out = {}
    for(var k in query){
        out[spec[k]] = query[k]
    }
    return out;
}

  const mapForward = (typeDef, spec, obj) => {
    let out = {}

    let fields = objectValues(typeDef._fields).map((x) => ({name: x.name, type: x.type}))


    for(var k in spec){
        out[spec[k]] = obj[k];
    }

    return out
}

 const mapBack = (spec, obj) => {
    let _spec = objectFlip(spec)
    let out = {}
    for(var k in _spec){
        out[_spec[k]] = obj[k] 
    }
    return out;
}
module.exports = {
    getFields,
    objectFlip,
    mapQuery,
    mapForward,
    mapBack
}