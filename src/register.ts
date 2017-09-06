import { Class } from './clazz';
import { Module} from './module';
import { Application } from './application';
import ResourceLoader = HERE.ResourceLoader;
import {UrlModuleLoader} from "./loader/url-module-loader";
import {UrlAppLoader} from "./loader/url-app-loader";

class Declare extends Class{
    name = '';
    url = '';
    constructor(declare){
        this.assign(['name','url'],declare);
        if(!this.name){
            throw new Error('param "name" field is invalid !');
        }
        if(!this.url){
            throw new Error('param "url" field is invalid !');
        }
    }
}
interface Resource{
    type:String;
    urls:String[];
    dependence:Resource;
}
function defineDeclares(object,name){
    var _declares = [];

    object[name] = function (declares) {
        if(declares === void 0){
            return _declares;
        }
        if(!(declares instanceof Array)){
            declares = [declares];
        }
        var _declareMap = {};
        _declares =  declares.map(function (declare) {
            var d = new Declare(declare);
            if(_declareMap[d.name]){
                throw new Error(d.name + ' : more than one declare : ' + d.name + ' found !');
            }
            _declareMap[d.name] = true;
            return d;
        });

        return this;
    };
}
var creating = false,instance = null;
var runtime = {
    moduleNameMap:{},
    appNameMap:{}
};
class Register{
    modules:Function;
    apps:Function;
    constructor(){
        if(!creating){
            throw new Error('constructor is private !');
        }
        defineDeclares(this,'modules');
        defineDeclares(this,'apps');
    }
    static getInstance() {
        if(instance){
            return instance;
        }
        creating = true;
        instance = new Register();
        creating = false;
        return instance;
    }
    addModule(declare) {
        this.modules().push(new Declare(declare));
        return this;
    }
    addApp(declare) {
        this.apps().push(new Declare(declare));
        return this;
    }
    register() {
        var modules = this.modules();
        var regModule = this.registerModule(modules).then(() => {
            this.modules = this.modules().filter(function (m) {
                return modules.indexOf(m) === -1;
            });
        });
        var apps = this.apps();
        var regApp = this.registerApp(apps).then(() => {
            this.apps = this.apps().filter(function (app) {
                return apps.indexOf(app) === -1;
            });
        });
        return Promise.all([regModule,regApp]);
    }
    private declares(name,url?):Declare[]{
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

        return declares;
    }
    registerModule(name,url?){
        var declares = this.declares(name,url);
        var nameMap = runtime.moduleNameMap;
        declares.forEach(function (_declare) {
            if(nameMap[_declare.name]){
                throw new Error('module : "' + _declare.name + '" is reduplicated !');
            }
            if(Module.has(_declare.name)){
                throw new TypeError('module : "' + _declare.name + '" has exist !');
            }
            nameMap[_declare.name] = true;
        });
        var promises = declares.map(function (_declare) {
            var loader = new UrlModuleLoader(_declare.name,_declare.url);
            return loader.register().then(function () {
                delete runtime.moduleNameMap[_declare.name];
            });
        });
        return Promise.all(promises);
    }
    registerApp(name,url?){
        var declares = this.declares(name,url);
        var nameMap = runtime.appNameMap;
        declares.forEach(function (_declare) {
            if(nameMap[_declare.name]){
                throw new Error('application : "' + _declare.name + '" is reduplicated !');
            }
            if(Application.has(_declare.name)){
                throw new TypeError('application : "' + _declare.name + '" has exist !');
            }
            nameMap[_declare.name] = true;
        });
        var promises = declares.map(function (_declare) {
            var loader = new UrlAppLoader(_declare.name,_declare.url);
            return loader.register().then(function () {
                delete runtime.appNameMap[_declare.name];
            });
        });
        return Promise.all(promises);
    }
}

export { Register }