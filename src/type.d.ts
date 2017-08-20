declare namespace HERE{
    class Super{
        items();
    }
    class Injector{
        constructor(parents?:Injector[]);
        parent:Super;
        service(name,define);
        getService(name);
        factory(name,define);
        getFactory(name);
        name:Function;
    }
    class ResourceLoader{
        constructor(option?);
        static load(resource):Promise;
        load(resource):Promise;
    }
    class ResourceUrl{
        static parseUrl(baseURI,url);
    }
}