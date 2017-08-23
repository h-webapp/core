import { Module } from './module';
import { Location } from './location';


var appNames = [];
var appManager = new HERE.Injector();
class Application extends Module{
    appName = '';
    route = {};
    constructor(){
        Module.apply(this,arguments);
    }
    location() {
        return Location.locate(Application,this.appName);
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
                throw new Error('application : ' + name + ' not found !');
            }
            return appManager.getService(name);
        }
        if(appNames.indexOf(name) >= 0){
            throw new Error('application : ' + name + ' has been defined !');
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

export { Application }