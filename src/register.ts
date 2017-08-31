import { Class } from './clazz';
import { Module,location as moduleLocation,validLocation as validModuleLocation } from './module';
import { Application,location as appLocation,validLocation as validAppLocation } from './application';
import ResourceLoader = HERE.ResourceLoader;

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
    preLoadResource:Resource;
    afterLoadResource:Resource;
    modules:Declare[];
    apps:Declare[];
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
        this.modules.push(new Declare(declare));
    }
    addApp(declare) {
        this.apps.push(new Declare(declare));
    }
    register() {

        var nameMap = {};
        this.modules.forEach(function (declare) {
            if(nameMap[declare.name]){
                throw new Error('module "' + declare.name + '" duplicated !');
            }
            nameMap[declare.name] = true;
            validModuleLocation(declare.name,declare.url);
        });
        nameMap = {};
        this.apps.forEach(function (declare) {
            if(nameMap[declare.name]){
                throw new Error('application "' + declare.name + '" duplicated !');
            }
            nameMap[declare.name] = true;
            validAppLocation(declare.name,declare.url);
        });

        var urls = [];
        this.modules.forEach(function (declare) {
            moduleLocation(declare.name,declare.url);
            urls.push(declare.url);
        });
        this.apps.forEach(function (declare) {
            appLocation(declare.name,declare.url);
            urls.push(declare.url);
        });

        var resource = {
            type:'js',
            urls:urls
        };

        var promise:Promise = null;
        if(this.preLoadResource){
            promise = ResourceLoader.load(this.preLoadResource);
        }
        if(promise){
            promise = promise.then(function () {
                return ResourceLoader.load(resource);
            });
        }else{
            promise = ResourceLoader.load(resource);
        }
        if(this.afterLoadResource){
            promise = promise.then(() => {
                return ResourceLoader.load(this.afterLoadResource);
            });
        }
        return promise;

    }
}

export { Register }