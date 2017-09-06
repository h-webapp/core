class LangResource{
    _resource = {};
    constructor(resource){
        if(resource){
            this._resource = resource;
        }
    }
    getText(key,defaultValue) {
        defaultValue = defaultValue || null;
        if(this._resource){
            return this._resource[key] || defaultValue;
        }
        return defaultValue;
    }
    addResource(resource) {
        var _resource = this._resource;
        Object.keys(resource).forEach(function (key) {
            _resource[key] = resource[key];
        });
    }
}

export { LangResource }