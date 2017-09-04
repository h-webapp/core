function defineGetSet(instance){
    var objectId,_keys,objKeys;
    function init(){
        _keys = [];
        objKeys = {};
        objectId = 1;
    }
    init();
    function isReferenceType(obj){
        return typeof obj === 'object' || typeof obj === 'function';
    }
    function mapKey(obj){

        var index = _keys.indexOf(obj);
        if(index === -1){
            _keys.push(obj);
        }
        if(!isReferenceType(obj)){
            return 'attr_' + typeof obj + '_' + obj;
        }
        var key = null;
        if(index === -1){
            key = 'attr_object_' + objectId++;
            objKeys[_keys.length - 1] = key;
        }else{
            key = objKeys[index];
        }
        return key;
    }

    var data = Object.create(null);

    instance.attr = function (name,value) {
        if(name === void 0){
            return null;
        }
        var index = _keys.indexOf(name);
        if(value === void 0){
            return index === -1 ? null : data[mapKey(name)];
        }

        name = mapKey(name);
        data[name] = value;
    };
    instance.remove = function (name) {
        var key = mapKey(name);
        var index = _keys.indexOf(name);

        if(index >= 0){
            _keys.splice(index,1);
        }
        if(isReferenceType(name)){
            if(index >= 0){
                delete objKeys[index];
            }
        }
        var value = data[key];
        delete data[key];
        return value;
    };
    instance.size = function () {
        return _keys.length;
    };
    instance.clear = function () {
        init();
    };
    instance.values = function () {
        return Object.keys(data).map(function (key) {
            return data[key];
        });
    };
    instance.keys = function () {
        return [].concat(_keys);
    }
}
class HashMap{
    attr:Function;
    constructor(){
        defineGetSet(this);
    }
    get(key){
        return this.attr(key);
    }
    put(key,value){
        this.attr(key,value);
    }
}

export { HashMap }