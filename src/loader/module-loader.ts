import { Module } from '../module';
import {Loader} from "./loader";

var ModuleLoadRequest = {};
var Loaders = {};
class ModuleLoader extends Loader{
    url:String = '';
    constructor(name:String){
        super(name);
        if(!Loaders[name]){
            Loaders[name] = this;
        }
    }
    static loader(name:String):ModuleLoader{
        return Loaders[name];
    }
    static forLoader(name:String):ModuleLoader{
        var loader = ModuleLoader.loader(name);
        if(loader){
            return loader;
        }
        return new ModuleLoader(name);
    }
    baseURI(){
        var url = this.url || '';
        var index = url.lastIndexOf('/');
        if(index >= 0){
            return url.slice(0,index);
        }
        return '';
    }
    item():Module{
        return Module.module(this.name);
    }
    loadRequest(){
        return ModuleLoadRequest;
    }
}

export { ModuleLoader }