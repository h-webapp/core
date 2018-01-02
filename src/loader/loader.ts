import { ResourceLoader,ResourceUrl } from 'dom-resource-loader/src/index'
import { Module } from '../module';
import { getLanguage } from '../i18n';

var ModuleLoadRequest = {};
function executeCalls(module:Module,type:String,data){

    var request = this[module.getIdentifier()];
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
function load(module:Module){

    var moduleLoader = module.loader();
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
        baseURI:moduleLoader.baseURI()
    });
    promises.push(moduleLoader.loadLangResource());
    var p = Promise.all(promises);
    p = p.then(function () {
        return loader.load(resources);
    });
    return p;
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
abstract class Loader{
    name:String = '';
    constructor(name:String){
        this.assertField('name',this.name);
        this.name = name;
    }
    assertField(fieldName,type){
        var value = this[fieldName];
        if(typeof value !== typeof type){
            throw new TypeError('loader "' + fieldName + '" is not a "' + (typeof value) + '" type !');
        }
    }
    baseURI(){
        return '';
    }
    parseUrl(url) {
        return ResourceUrl.parseUrl(this.baseURI(),url);
    }
    abstract item():Module;
    loadResource(resources){
        var loader = new ResourceLoader({
            baseURI:this.baseURI()
        });
        return loader.load.apply(loader,arguments);
    }
    loadLangResource () {
        var module:Module = this.item();
        var _resource = module.resource;
        return Promise.all(_resource.langFiles.map((file) => {
            var url = this.parseUrl(parseLangFile(file));
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
    loadRequest(){
        return ModuleLoadRequest;
    }
    load(){
        var item = this.item();
        var resolve:Function = null,reject:Function = null;
        var promise = new Promise(function (_resolve,_reject) {
            resolve = _resolve;
            reject = _reject;
        });

        var LoadRequest = this.loadRequest();
        var request = LoadRequest[item.getIdentifier()];
        if(!request){
            request = LoadRequest[item.getIdentifier()] = {
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

        load(item).then((result) => {
            executeCalls.call(LoadRequest,item,'resolve',result);
        }, (e) => {
            executeCalls.call(LoadRequest,item,'reject',e);
        });
        return promise;
    }
}

export { Loader }