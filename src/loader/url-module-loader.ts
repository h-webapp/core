import {ModuleLoader} from "./module-loader";
import { ResourceLoader } from 'dom-resource-loader/src/index'
class UrlModuleLoader extends ModuleLoader{
    url:String = ''
    constructor(name:String,url:String){
        super(name);
        this.assertField('url',this.url);
        this.url = url;
    }
    static forLoader(name:String,url?:String):UrlModuleLoader{
        var loader = ModuleLoader.loader(name);
        if(loader){
            if(!(loader instanceof UrlModuleLoader)){
                throw new TypeError('loader is not a UrlModuleLoader instance !');
            }
            return <UrlModuleLoader>loader;
        }
        return new UrlModuleLoader(name,url);
    }
    baseURI(){
        var url = this.url || '';
        var index = url.lastIndexOf('/');
        if(index >= 0){
            return url.slice(0,index);
        }
        return '';
    }

    register(){
        return ResourceLoader.load({
            type:'js',
            urls:[this.url]
        })
    }
}

export { UrlModuleLoader }