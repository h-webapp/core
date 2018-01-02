import {AppLoader} from "./app-loader";
import { ResourceLoader } from 'dom-resource-loader/src/index'
class UrlAppLoader extends AppLoader{
    url:String = '';
    constructor(name:String,url:String){
        super(name);
        this.assertField('url',this.url);
        this.url = url;
    }
    static forLoader(name:String,url?:String):UrlAppLoader{
        var loader = AppLoader.loader(name);
        if(loader){
            if(!(loader instanceof UrlAppLoader)){
                throw new TypeError('loader is not a UrlAppLoader instance !');
            }
            return <UrlAppLoader>loader;
        }
        return new UrlAppLoader(name,url);
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
        });
    }
}

export { UrlAppLoader }