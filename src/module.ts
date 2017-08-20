import { Location } from './location';
import { Class } from './clazz';
import { getLanguage } from './i18n';
import { Http } from './http';
var moduleNames = [];
var moduleManager = new HERE.Injector();
class Resource extends Class{
    baseURI:String;
    js:String[] = [];
    css:String[] = [];
    langFiles:String[] = [];
    jsSerial:Boolean = false;
    cssSerial:Boolean = false;
    constructor(resource){
        this.assign(['baseURI','js','css','jsSerial','cssSerial','langFiles'],resource);
    }
}
class LangResource{
    _resource = {};
    constructor(resource){
        if(resource){
            this._resource = resource;
        }
    }
    getText(key,defaultValue) {
    defaultValue = defaultValue || null;
        if(this._resource){
            return this._resource[key] || defaultValue;
        }
        return defaultValue;
    }
    addResource(resource) {
        var _resource = this._resource;
        Object.keys(resource).forEach(function (key) {
            _resource[key] = resource[key];
        });
    }
}
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
function parseLangFile(file){
    var index = file.lastIndexOf('.');
    var fileName = file.slice(0,index);
    var lang = getLanguage();
    if(lang){
        fileName = fileName + '_' + lang;
    }
    return fileName + file.slice(index);
}
function load(module:Module){
    var _resource = module.resource;
    var resources = [];
    if(_resource.js.length > 0){
        resources.push({
            type:'js',
            serial:_resource.jsSerial,
            urls:Module.ensureArray(_resource.js)
        });
    }
    if(_resource.css.length > 0){
        resources.push({
            type:'css',
            serial:_resource.cssSerial,
            urls:Module.ensureArray(_resource.css)
        });
    }
    var parent = module.parent;
    var promises = [];
    if(parent){
        parent.items().forEach(function (m) {
            if(!(m instanceof Module)){
                return;
            }
            promises.push(m.load());
        });
    }
    var loader = new HERE.ResourceLoader({
        baseURI:module.baseURI()
    });
    promises.push(module.loadLangResource());
    var p = Promise.all(promises);
    p = p.then(function () {
        return loader.load(resources);
    });
    return p;
}
class Module extends HERE.Injector{
    moduleName:String;
    description = '';
    loaded = false;
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

        HERE.Injector.apply(this,arguments);


        defineProperty(this,'langResource',LangResource);

        defineProperty(this,'resource',Resource);

        defineLangService(this);
    }
    location() {
        return Location.locate(Module,this.moduleName);
    }
    baseURI(){
        var url = this.location();
        if(!url){
            return '';
        }
        var index = url.lastIndexOf('/');
        if(index >= 0){
            return url.slice(0,index);
        }
        return '';
    }
    parseUrl(url) {
        return HERE.ResourceUrl.parseUrl(this.baseURI(),url);
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
    loadLangResource () {
        var module = this;
        var _resource = this.resource;
        return Promise.all(_resource.langFiles.map(function (file) {
            var url = module.parseUrl(parseLangFile(file));
            return Http.getJSON(url).then(function (data) {
                return data;
            }, function () {
                console.error('lang file : ' + url + ' load error !');
            });
        })).then(function (dataList) {
            dataList.forEach(function (data) {
                if(data){
                    module.langResource.addResource(data);
                }
            });
        });
    }
    load() {
        var _this = this;
        var promise = new Promise(function (resolve,reject) {
            if(_this.loaded){
                resolve();
                return;
            }
            var p = load(_this);
            p.then(function (result) {
                _this.loaded = true;
                _this.ready();
                resolve(result);
            }, function (e) {
                reject(e);
            });
        });
        return promise;
    }
    static modules() {
        return moduleNames.map(function (name) {
            return Module.module(name);
        });
    }
    static module(name,define?,modules?) {
        if(!name){
            return;
        }
        if(define === void 0){
            if(moduleNames.indexOf(name) === -1){
                throw new Error('module : ' + name + ' not found !');
            }
            return moduleManager.getService(name);
        }
        if(moduleNames.indexOf(name) >= 0){
            throw new Error('module : ' + name + ' has been defined !');
        }
        moduleManager.service(name, function () {
            var _modules = Module.ensureArray(modules).map(function (moduleName) {
                return Module.module(moduleName);
            });
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