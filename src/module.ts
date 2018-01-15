import { ModuleLoader } from './loader/module-loader';
import { Injector } from 'injector-ioc/src/index'
import { Resource } from './resource/resource'
import { LangResource } from './resource/lang-resource'
import {Loader} from "./loader/loader";

var moduleNames = [];
var moduleManager = new Injector();
function defineProperty(object,name,constructorFn){
    var value = constructorFn ? new constructorFn() : null;
    Object.defineProperty(object,name,{
        get: function () {
            return value;
        },
        set: function (v) {
            value = new constructorFn(v);
        }
    });
}
function defineLangService(module:Module){
    module.service('language', function () {
        this.getLangText = function (key,defaultValue) {
            return module.getLangText(key,defaultValue);
        }
    });
}

function getLangText(m:Module,key,defaultValue){
    defaultValue = defaultValue || null;
    var caption =  m.langResource.getText(key,defaultValue);
    if(!caption){
        m.parent.items().some(function (_m) {
            if(m instanceof Module){
                caption = _m.getLangText(key,null);
            }
            return !!caption;
        });
    }
    return caption;
}

class Module extends Injector{
    moduleName:String;
    description = '';
    langResource:LangResource;
    resource:Resource;
    _readyListeners:Function[] = [];
    static ensureArray(values){
        if(!values){
            values = [];
        }
        if(!(values instanceof Array)){
            values = [].concat(values);
        }
        return values;
    }
    constructor(){

        Injector.apply(this,arguments);

        defineProperty(this,'langResource',LangResource);

        defineProperty(this,'resource',Resource);

        defineLangService(this);
    }
    load():Promise{
        return this.loader().load();
    }
    loadResource():Promise{
        var loader = this.loader();
        var loadResource = loader.loadResource;
        return loadResource.apply(loader,arguments);
    }
    loader():Loader{
        return ModuleLoader.loader(this.getIdentifier());
    }
    getIdentifier(){
        return this.moduleName;
    }
    getLangText(key,defaultValue) {
        return getLangText(this,key,defaultValue);
    }
    ready(fn?:Function) {
        var _this = this;
        if(fn === void 0){
            this._readyListeners.forEach(function (listener) {
                try{
                    listener.call(_this)
                }catch(e){
                    console.error(e);
                }
            });
            this._readyListeners.length = 0;
            return;
        }
        if(typeof fn === 'function'){
            this._readyListeners.push(fn);
        }
    }
    static has(name:String){
        return moduleNames.indexOf(name) >= 0;
    }
    static modules() {
        return moduleNames.map(function (name) {
            return Module.module(name);
        });
    }
    static parseDependence(modules:String[]){
        return Module.ensureArray(modules).map(function (moduleName) {
            if(moduleName instanceof Module){
                return moduleName;
            }
            if(typeof moduleName === 'function'){
                return moduleName();
            }
            return Module.module(moduleName);
        });
    }
    static module(name,define?,modules?) {
        if(!name){
            return;
        }
        if(define === void 0){
            if(moduleNames.indexOf(name) === -1){
                throw new Error('module : "' + name + '" not found !');
            }
            return moduleManager.getService(name);
        }
        if(moduleNames.indexOf(name) >= 0){
            throw new Error('module : "' + name + '" has been defined !');
        }
        ModuleLoader.forLoader(name);
        moduleManager.service(name, function () {
            var _modules = Module.parseDependence(modules);
            var m = new Module(_modules);
            Object.defineProperty(m,'moduleName',{
                value:name
            });
            m.name(name);
            define.call(m);
            return m;
        });
        moduleNames.push(name);
        return Module;
    }
}

export { Module }