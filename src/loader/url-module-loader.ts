import {ModuleLoader} from "./module-loader";
import ResourceLoader = HERE.ResourceLoader;
class UrlModuleLoader extends ModuleLoader{
    url:String = ''
    constructor(name:String,url:String){
        super(name);
        this.assertField('url',this.url);
        this.url = url;
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