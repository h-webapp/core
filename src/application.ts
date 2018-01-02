import { Module } from './module';
import { HashMap } from './hashmap';
import { Injector } from 'injector-ioc/src/index'
import {AppLoader} from "./loader/app-loader";
import {Loader} from "./loader/loader";

var appNames = [];
var appManager = new Injector;
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
        delete this.moduleName;
    }
    loader():Loader{
        return AppLoader.loader(this.getIdentifier());
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
        AppLoader.forLoader(name);
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

export { Application }