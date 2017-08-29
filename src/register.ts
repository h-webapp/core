import { Class } from './clazz';
import { Location } from './location';
import { Module } from './module';
import { Application } from './application';

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
function defineDeclares(object,name){
    var _declares = [];

    Object.defineProperty(object,name,{
        set: function (declares) {
            if(!declares){
                return;
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
        },
        get: function () {
            return _declares;
        }
    });
}
var creating = false,instance = null;
class Register{
    modules:Declare[];
    apps:Declare[];
    main = '';
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
    registerModule(declare) {
        this.modules.push(new Declare(declare));
    }
    unRegisterModule(declare) {
        var name = declare.name;
        var modules = this.modules.filter(function (m) {
            return m.name !== name;
        });
        if(modules.length !== this.modules.length){
            this.modules = modules;
        }
    }
    registerApp(declare) {
        this.apps.push(new Declare(declare));
    }
    unRegisterApp(declare) {
        var name = declare.name;
        var apps = this.apps.filter(function (m) {
            return m.name !== name;
        });
        if(apps.length !== this.apps.length){
            this.apps = apps;
        }
    }
    load() {
        var urls = [];
        this.modules.forEach(function (declare) {
            Location.locate(Module,declare.name,declare.url);
            urls.push(declare.url);
        });
        this.apps.forEach(function (declare) {
            Location.locate(Application,declare.name,declare.url);
            urls.push(declare.url);
        });

        var resource = {
            type:'js',
            urls:urls
        };
        var mainResource = {
            type:'js',
            urls:[],
            dependence:resource
        };
        if(this.main){
            mainResource.urls.push(this.main);
        }
        return HERE.ResourceLoader.load(mainResource);

    }
}

export { Register }