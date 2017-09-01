import { Location } from './location';
import { Class } from './clazz';
import { getLanguage } from './i18n';
import ResourceLoader = HERE.ResourceLoader;
import ResourceUrl = HERE.ResourceUrl;
import Injector = HERE.Injector;

var moduleNames = [];
var moduleManager = new Injector();
class Resource extends Class{
    js:String[] = [];
    css:String[] = [];
    langFiles:String[] = [];
    jsSerial:Boolean = false;
    cssSerial:Boolean = false;
    constructor(resource){
        this.assign(['js','css','jsSerial','cssSerial','langFiles'],resource);
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
    var loader = new ResourceLoader({
        baseURI:module.baseURI()
    });
    promises.push(module.loadLangResource());
    var p = Promise.all(promises);
    p = p.then(function () {
        return loader.load(resources);
    });
    return p;
}
var LoadRequest = {};
var ModuleRegister = {};
function validLocation(name,url){
    if(typeof url !== 'string'){
        throw new TypeError('url "' + url + '" is invalid !')
    }
    if(ModuleRegister[name] && ModuleRegister[name] !== url){
        throw new Error('module "' + name + '" has been located !');
    }
}
function location(name,url){
    ModuleRegister[name] = url;
}
function initModuleDeclare(declares){
    var nameMap = {};
    declares.forEach(function (_declare) {
        if(moduleNames.indexOf(_declare.name) >= 0){
            throw new Error('module "' + _declare.name + '" has exists !');
        }
        if(nameMap[_declare.name]){
            throw new Error('module "' + _declare.name + '" duplicated !');
        }
        nameMap[_declare.name] = true;
        _declare['url'] = _declare.url || ModuleRegister[_declare.name];
        if(typeof _declare.url !== 'string'){
            throw new TypeError('url of module "' + _declare.name + '" is invalid !');
        }
        validLocation(_declare.name,_declare.url);
    });
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
    static register(name,url){
        var declares = [];
        if(typeof name === 'string'){
            declares.push({
                name:name,
                url:url
            });
        }else if(name instanceof Array){
            declares = declares.concat(name);
        }else if(typeof name === 'object'){
            declares.push(name);
        }
        initModuleDeclare(declares);

        var urls = declares.map(function (_declare) {
            location(_declare.name,_declare.url);
            return _declare.url;
        });
        return ResourceLoader.load({
            type:'js',
            urls:urls
        });
    }
    constructor(){

        Injector.apply(this,arguments);

        defineProperty(this,'langResource',LangResource);

        defineProperty(this,'resource',Resource);

        defineLangService(this);
    }
    location() {
        var url =  ModuleRegister[this.moduleName];
        if(!url){
            url = '';
        }
        return url;
    }
    getIdentifier(){
        return this.moduleName;
    }
    baseURI(){
        var url = this.location();
        var index = url.lastIndexOf('/');
        if(index >= 0){
            return url.slice(0,index);
        }
        return '';
    }
    parseUrl(url) {
        return ResourceUrl.parseUrl(this.baseURI(),url);
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
            return ResourceLoader.load({
                type:'json',
                urls:[url]
            }).then(function (jsonArray) {
                return jsonArray[0];
            }, function () {
                console.error('lang file : "' + url + '" load error !');
            });
        })).then(function (dataList) {
            dataList.forEach(function (data) {
                if(data){
                    module.langResource.addResource(data);
                }
            });
        });
    }
    protected static executeCalls(module:Module,type:String,data){

        var request = LoadRequest[module.getIdentifier()];
        request.data = data;
        if(type === 'resolve'){
            request.status = 1;
        }else if(type === 'reject'){
            request.status = 2;
            console.error('load : "' + module.getIdentifier() + '"  error !');
        }

        if(type === 'resolve'){
            module.ready();
        }
        request.calls.forEach(function (call) {
            var fn = call[type];
            try{
                fn(data);
            }catch (err){
                console.error(err);
            }
        });
        request.calls.length = 0;
    }
    loadResource(resources){
        var loader = new ResourceLoader({
            baseURI:this.baseURI()
        });
        return loader.load.apply(loader,arguments);
    }
    load() {
        var resolve:Function = null,reject:Function = null;
        var promise = new Promise(function (_resolve,_reject) {
            resolve = _resolve;
            reject = _reject;
        });
        var request = LoadRequest[this.getIdentifier()];
        if(!request){
            request = LoadRequest[this.getIdentifier()] = {
                status:0,
                data:null,
                calls:[]
            };
        }
        if(request.status === 1){
            resolve(request.data);
            return promise;
        }
        if(request.status === 2){
            reject(request.data);
            return promise;
        }

        request.calls.push({
            resolve:resolve,
            reject:reject
        });


        load(this).then((result) => {
            Module.executeCalls(this,'resolve',result);
        }, (e) => {
            Module.executeCalls(this,'reject',e);
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
                throw new Error('module : "' + name + '" not found !');
            }
            return moduleManager.getService(name);
        }
        if(moduleNames.indexOf(name) >= 0){
            throw new Error('module : "' + name + '" has been defined !');
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

export { Module,location,validLocation }