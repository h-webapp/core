import { Module } from './module';
import { Location } from './location';
import Injector = HERE.Injector;
import ResourceLoader = HERE.ResourceLoader;

var appNames = [];
var appManager = new Injector;
var ApplicationRegister = {};
function location(name,url){
    if(!url){
        throw new TypeError('url "' + url + '" is invalid !')
    }
    if(ApplicationRegister[name] && ApplicationRegister[name] !== url){
        throw new Error('application "' + name + '" has been located !');
    }
    ApplicationRegister[name] = url;
}
function initAppDeclare(declares){
    declares.forEach(function (_declare) {
        if(appNames.indexOf(_declare.name) >= 0){
            throw new Error('application "' + _declare.name + '" has been registered !');
        }
        _declare['url'] = _declare.url || ApplicationRegister[_declare.name];
        if(typeof _declare.url !== 'string'){
            throw new TypeError('url of application "' + _declare.name + '" is invalid !');
        }
        location(_declare.name,_declare.url);
    });
}
class Application extends Module{
    appName = '';
    route = {};
    constructor(){
        Module.apply(this,arguments);
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
            throw new Error('application "' + this.appName + '"  not be registered !');
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

export { Application,location }