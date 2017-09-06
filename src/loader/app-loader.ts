import { Application } from '../application';
import {Loader} from "./loader";
var AppLoadRequest = {};
var Loaders = {};
class AppLoader extends Loader{
    constructor(name:String){
        super(name);
        if(!Loaders[name]){
            Loaders[name] = this;
        }
    }
    static loader(name:String):AppLoader{
        return Loaders[name];
    }
    item():Application{
        return Application.app(this.name);
    }
    loadRequest(){
        return AppLoadRequest;
    }
}

export { AppLoader }