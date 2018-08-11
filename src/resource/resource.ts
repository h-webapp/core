import { Class } from '../clazz';
class Resource extends Class{
    js:String[] = [];
    css:String[] = [];
    attributes:Object = {};
    langFiles:String[] = [];
    jsSerial:Boolean = false;
    cssSerial:Boolean = false;
    constructor(resource){
        this.assign(['js','css','jsSerial','cssSerial','langFiles','attributes'],resource);
    }
}

export { Resource }