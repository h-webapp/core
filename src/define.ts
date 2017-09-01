
class DefineCache{
    cache = {};
    constCache = {};
    define(name:String,define?){
        if(define === void 0){
            return this.cache[name];
        }
        if(this.constCache[name]){
            throw new Error('define name : "' + name + '" has been defined as a constant !');
        }
        this.cache[name] = define;
    }
    constant(name,define?){
        if(define === void 0){
            return this.constCache[name] ? this.cache[name] : undefined;
        }
        if(!define){
            return;
        }
        this.constCache[name] = true;
        this.cache[name] = define;
    }
}

const defineObj = new DefineCache();
const define = function () {
    return defineObj.define.apply(defineObj,arguments);
};
const constant = function(){
    return defineObj.constant.apply(defineObj,arguments);
};
export { define,constant }