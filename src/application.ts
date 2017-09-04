import { Module } from './module';
import { Location } from './location';
import { HashMap } from './hashmap';
import Injector = HERE.Injector;
import ResourceLoader = HERE.ResourceLoader;

var appNames = [];
var appManager = new Injector;
var ApplicationRegister = {};
function validLocation(name,url){
    if(typeof url !== 'string'){
        throw new TypeError('url "' + url + '" is invalid !')
    }
    if(ApplicationRegister[name] && ApplicationRegister[name] !== url){
        throw new Error('application "' + name + '" has been located !');
    }
}
function location(name,url){
    ApplicationRegister[name] = url;
}
function initAppDeclare(declares){
    var nameMap = {};
    declares.forEach(function (_declare) {
        if(appNames.indexOf(_declare.name) >= 0){
            throw new Error('application "' + _declare.name + '" has been registered !');
        }
        if(nameMap[_declare.name]){
            throw new Error('application "' + _declare.name + '" duplicated !');
        }
        nameMap[_declare.name] = true;
        _declare['url'] = _declare.url || ApplicationRegister[_declare.name];
        if(typeof _declare.url !== 'string'){
            throw new TypeError('url of application "' + _declare.name + '" is invalid !');
        }
        validLocation(_declare.name,_declare.url);
    });
}
function defineDataProp(object){
    var map = new HashMap();
    object.data = function (name,value) {
        return map.attr(name,value);
    };
}
class Application extends Module{
    appName = '';
    route = {};
    constructor(){
        Module.apply(this,arguments);
        defineDataProp(this);
    }
    static extend(option){
        var clazz = function () {
            Application.apply(this,arguments);
        }
        clazz.prototype = Object.create(Application.prototype,{
            constructor:clazz
        });
        var props = option['props'] || {},
            staticProps = option['staticProps'] || {};

        Object.keys(props).forEach(function (key) {
            clazz.prototype[key] = props[key];
        });

        Object.keys(staticProps).forEach(function (key) {
            clazz[key] = props[key];
        });

        return clazz;
    }
    static register(name,url){
        var declares = [];
        if(typeof name === 'string'){
            url = url || ApplicationRegister[name];
            declares.push({
                name:name,
                url:url
            });
        }else if(name instanceof Array){
            declares = declares.concat(name);
        }else if(typeof name === 'object'){
            declares.push(name);
        }
        initAppDeclare(declares);

        var urls = declares.map(function (_declare) {
            location(_declare.name,_declare.url);
            return _declare.url;
        });
        return ResourceLoader.load({
            type:'js',
            urls:urls
        });
    }
    location() {
        var url =  ApplicationRegister[this.appName];
        if(!url){
            url = '';
        }
        return url;
    }
    getIdentifier(){
        return this.appName;
    }
    static apps () {
        return appNames.map(function (name) {
            return Application.app(name);
        });
    }
    static app(name,define?,modules?,apps?) {
        if(!name){
            return;
        }
        if(define === void 0){
            if(appNames.indexOf(name) === -1){
                throw new Error('application : "' + name + '" not found !');
            }
            return appManager.getService(name);
        }
        if(appNames.indexOf(name) >= 0){
            throw new Error('application : "' + name + '" has been defined !');
        }
        appManager.service(name, function () {
            var _apps = Module.ensureArray(apps).map(function (appName) {
                return Application.app(appName);
            });
            var _modules = Module.ensureArray(modules).map(function (moduleName) {
                return Module.module(moduleName);
            });
            var app = new Application(_apps,_modules);
            Object.defineProperty(app,'appName',{
                value:name
            });
            app.name(name);
            define.call(app);
            return app;
        });
        appNames.push(name);
        return Application;
    }
}

export { Application,location,validLocation }