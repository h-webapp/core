
class DefineCache{
    cache = {};
    constCache = {};
    define(name:String,define?){
        if(define === void 0){
            return this.cache[name];
        }
        if(this.constCache[name]){
            throw new Error('define name : ' + name + ' has been defined as constant !');
        }
        define[name] = define;
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
    defineObj.define.apply(defineObj,arguments);
};
const constant = function(){
    defineObj.constant.apply(defineObj,arguments);
};
export { define,constant }