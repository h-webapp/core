/* webapp core */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.HERE = global.HERE || {}, global.HERE.FRAMEWORK = global.HERE.FRAMEWORK || {})));
}(this, (function (exports) { 'use strict';

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function defineGetSet(instance) {
    var objectId, _keys, objKeys;
    function init() {
        _keys = [];
        objKeys = {};
        objectId = 1;
    }
    init();
    function isReferenceType(obj) {
        return typeof obj === 'object' || typeof obj === 'function';
    }
    function mapKey(obj) {
        var index = _keys.indexOf(obj);
        if (index === -1) {
            _keys.push(obj);
        }
        if (!isReferenceType(obj)) {
            return 'attr_' + typeof obj + '_' + obj;
        }
        var key = null;
        if (index === -1) {
            key = 'attr_object_' + objectId++;
            objKeys[_keys.length - 1] = key;
        }
        else {
            key = objKeys[index];
        }
        return key;
    }
    var data = Object.create(null);
    instance.attr = function (name, value) {
        if (name === void 0) {
            return null;
        }
        var index = _keys.indexOf(name);
        if (value === void 0) {
            return index === -1 ? null : data[mapKey(name)];
        }
        name = mapKey(name);
        data[name] = value;
    };
    instance.remove = function (name) {
        var key = mapKey(name);
        var index = _keys.indexOf(name);
        if (index >= 0) {
            _keys.splice(index, 1);
        }
        if (isReferenceType(name)) {
            if (index >= 0) {
                delete objKeys[index];
            }
        }
        var value = data[key];
        delete data[key];
        return value;
    };
    instance.size = function () {
        return _keys.length;
    };
    instance.clear = function () {
        init();
    };
    instance.values = function () {
        return Object.keys(data).map(function (key) {
            return data[key];
        });
    };
    instance.keys = function () {
        return [].concat(_keys);
    };
}
var HashMap = (function () {
    function HashMap() {
        defineGetSet(this);
    }
    HashMap.prototype.get = function (key) {
        return this.attr(key);
    };
    HashMap.prototype.put = function (key, value) {
        this.attr(key, value);
    };
    return HashMap;
}());

var DefineCache = (function () {
    function DefineCache() {
        this.cache = {};
        this.constCache = {};
    }
    DefineCache.prototype.define = function (name, define) {
        if (define === void 0) {
            return this.cache[name];
        }
        if (this.constCache[name]) {
            throw new Error('define name : "' + name + '" has been defined as a constant !');
        }
        this.cache[name] = define;
    };
    DefineCache.prototype.constant = function (name, define) {
        if (define === void 0) {
            return this.constCache[name] ? this.cache[name] : undefined;
        }
        if (!define) {
            return;
        }
        this.constCache[name] = true;
        this.cache[name] = define;
    };
    return DefineCache;
}());
var defineObj = new DefineCache();
var define = function () {
    return defineObj.define.apply(defineObj, arguments);
};
var constant = function () {
    return defineObj.constant.apply(defineObj, arguments);
};

var Location = (function () {
    function Location() {
    }
    Location.locate = function (clazz, identifyName, url) {
        var $locations = clazz['$locations'];
        if (!$locations) {
            $locations = {};
            Object.defineProperty(clazz, '$locations', {
                value: $locations
            });
        }
        if (url === void 0) {
            return $locations[identifyName] || '';
        }
        if ($locations[identifyName]) {
            return;
        }
        Object.defineProperty($locations, identifyName, {
            value: url
        });
    };
    return Location;
}());

(function () {
    if (typeof navigator === 'undefined') {
        console.warn('navigator language init fail !');
        return;
    }
    var language = navigator.language || navigator['browserLanguage'] || navigator['userLanguage'] || 'zh-cn';
    language = language.toLowerCase();
    constant('language', language);
})();
function getLanguage() {
    return constant('language');
}

var ResourceLoader = HERE.ResourceLoader;
var ResourceUrl = HERE.ResourceUrl;
var ModuleLoadRequest$1 = {};
function executeCalls(module, type, data) {
    var request = this[module.getIdentifier()];
    request.data = data;
    if (type === 'resolve') {
        request.status = 1;
    }
    else if (type === 'reject') {
        request.status = 2;
        console.error('load : "' + module.getIdentifier() + '"  error !');
    }
    if (type === 'resolve') {
        module.ready();
    }
    request.calls.forEach(function (call) {
        var fn = call[type];
        try {
            fn(data);
        }
        catch (err) {
            console.error(err);
        }
    });
    request.calls.length = 0;
}
function load(module) {
    var moduleLoader = module.loader();
    var _resource = module.resource;
    var resources = [];
    if (_resource.js.length > 0) {
        resources.push({
            type: 'js',
            serial: _resource.jsSerial,
            urls: Module.ensureArray(_resource.js)
        });
    }
    if (_resource.css.length > 0) {
        resources.push({
            type: 'css',
            serial: _resource.cssSerial,
            urls: Module.ensureArray(_resource.css)
        });
    }
    var parent = module.parent;
    var promises = [];
    if (parent) {
        parent.items().forEach(function (m) {
            if (!(m instanceof Module)) {
                return;
            }
            promises.push(m.load());
        });
    }
    var loader = new ResourceLoader({
        baseURI: moduleLoader.baseURI()
    });
    promises.push(moduleLoader.loadLangResource());
    var p = Promise.all(promises);
    p = p.then(function () {
        return loader.load(resources);
    });
    return p;
}
function parseLangFile(file) {
    var index = file.lastIndexOf('.');
    var fileName = file.slice(0, index);
    var lang = getLanguage();
    if (lang) {
        fileName = fileName + '_' + lang;
    }
    return fileName + file.slice(index);
}
var Loader = (function () {
    function Loader(name) {
        this.name = '';
        this.assertField('name', this.name);
        this.name = name;
    }
    Loader.prototype.assertField = function (fieldName, type) {
        var value = this[fieldName];
        if (typeof value !== typeof type) {
            throw new TypeError('loader "' + fieldName + '" is not a "' + (typeof value) + '" type !');
        }
    };
    Loader.prototype.baseURI = function () {
        return '';
    };
    Loader.prototype.parseUrl = function (url) {
        return ResourceUrl.parseUrl(this.baseURI(), url);
    };
    Loader.prototype.loadResource = function (resources) {
        var loader = new ResourceLoader({
            baseURI: this.baseURI()
        });
        return loader.load.apply(loader, arguments);
    };
    Loader.prototype.loadLangResource = function () {
        var _this = this;
        var module = this.item();
        var _resource = module.resource;
        return Promise.all(_resource.langFiles.map(function (file) {
            var url = _this.parseUrl(parseLangFile(file));
            return ResourceLoader.load({
                type: 'json',
                urls: [url]
            }).then(function (jsonArray) {
                return jsonArray[0];
            }, function () {
                console.error('lang file : "' + url + '" load error !');
            });
        })).then(function (dataList) {
            dataList.forEach(function (data) {
                if (data) {
                    module.langResource.addResource(data);
                }
            });
        });
    };
    Loader.prototype.loadRequest = function () {
        return ModuleLoadRequest$1;
    };
    Loader.prototype.load = function () {
        var item = this.item();
        var resolve = null, reject = null;
        var promise = new Promise(function (_resolve, _reject) {
            resolve = _resolve;
            reject = _reject;
        });
        var LoadRequest = this.loadRequest();
        var request = LoadRequest[item.getIdentifier()];
        if (!request) {
            request = LoadRequest[item.getIdentifier()] = {
                status: 0,
                data: null,
                calls: []
            };
        }
        if (request.status === 1) {
            resolve(request.data);
            return promise;
        }
        if (request.status === 2) {
            reject(request.data);
            return promise;
        }
        request.calls.push({
            resolve: resolve,
            reject: reject
        });
        load(item).then(function (result) {
            executeCalls.call(LoadRequest, item, 'resolve', result);
        }, function (e) {
            executeCalls.call(LoadRequest, item, 'reject', e);
        });
        return promise;
    };
    return Loader;
}());

var ModuleLoadRequest = {};
var Loaders = {};
var ModuleLoader = (function (_super) {
    __extends(ModuleLoader, _super);
    function ModuleLoader(name) {
        _super.call(this, name);
        this.url = '';
        if (!Loaders[name]) {
            Loaders[name] = this;
        }
    }
    ModuleLoader.loader = function (name) {
        return Loaders[name];
    };
    ModuleLoader.prototype.baseURI = function () {
        var url = this.url || '';
        var index = url.lastIndexOf('/');
        if (index >= 0) {
            return url.slice(0, index);
        }
        return '';
    };
    ModuleLoader.prototype.item = function () {
        return Module.module(this.name);
    };
    ModuleLoader.prototype.loadRequest = function () {
        return ModuleLoadRequest;
    };
    return ModuleLoader;
}(Loader));

var Class = (function () {
    function Class() {
    }
    Class.prototype.assign = function (fields, option, machType) {
        var _this = this;
        if (machType === void 0) { machType = true; }
        if (!option) {
            return;
        }
        fields.forEach(function (field) {
            if (option[field] === void 0) {
                return;
            }
            if (!machType || typeof _this[field] === typeof option[field]) {
                _this[field] = option[field];
            }
        });
    };
    return Class;
}());

var Resource = (function (_super) {
    __extends(Resource, _super);
    function Resource(resource) {
        this.js = [];
        this.css = [];
        this.langFiles = [];
        this.jsSerial = false;
        this.cssSerial = false;
        this.assign(['js', 'css', 'jsSerial', 'cssSerial', 'langFiles'], resource);
    }
    return Resource;
}(Class));

var LangResource = (function () {
    function LangResource(resource) {
        this._resource = {};
        if (resource) {
            this._resource = resource;
        }
    }
    LangResource.prototype.getText = function (key, defaultValue) {
        defaultValue = defaultValue || null;
        if (this._resource) {
            return this._resource[key] || defaultValue;
        }
        return defaultValue;
    };
    LangResource.prototype.addResource = function (resource) {
        var _resource = this._resource;
        Object.keys(resource).forEach(function (key) {
            _resource[key] = resource[key];
        });
    };
    return LangResource;
}());

var Injector = HERE.Injector;
var moduleNames = [];
var moduleManager = new Injector();
function defineProperty(object, name, constructorFn) {
    var value = constructorFn ? new constructorFn() : null;
    Object.defineProperty(object, name, {
        get: function () {
            return value;
        },
        set: function (v) {
            value = new constructorFn(v);
        }
    });
}
function defineLangService(module) {
    module.service('language', function () {
        this.getLangText = function (key, defaultValue) {
            return module.getLangText(key, defaultValue);
        };
    });
}
function getLangText(m, key, defaultValue) {
    defaultValue = defaultValue || null;
    var caption = m.langResource.getText(key, defaultValue);
    if (!caption) {
        m.parent.items().some(function (_m) {
            if (m instanceof Module) {
                caption = _m.getLangText(key, null);
            }
            return !!caption;
        });
    }
    return caption;
}
var Module = (function (_super) {
    __extends(Module, _super);
    function Module() {
        this.description = '';
        this._readyListeners = [];
        Injector.apply(this, arguments);
        defineProperty(this, 'langResource', LangResource);
        defineProperty(this, 'resource', Resource);
        defineLangService(this);
    }
    Module.ensureArray = function (values) {
        if (!values) {
            values = [];
        }
        if (!(values instanceof Array)) {
            values = [].concat(values);
        }
        return values;
    };
    Module.prototype.load = function () {
        return this.loader().load();
    };
    Module.prototype.loadResource = function () {
        var loader = this.loader();
        var loadResource = loader.loadResource;
        return loadResource.apply(loader, arguments);
    };
    Module.prototype.loader = function () {
        return ModuleLoader.loader(this.getIdentifier());
    };
    Module.prototype.getIdentifier = function () {
        return this.moduleName;
    };
    Module.prototype.getLangText = function (key, defaultValue) {
        return getLangText(this, key, defaultValue);
    };
    Module.prototype.ready = function (fn) {
        var _this = this;
        if (fn === void 0) {
            this._readyListeners.forEach(function (listener) {
                try {
                    listener.call(_this);
                }
                catch (e) {
                    console.error(e);
                }
            });
            this._readyListeners.length = 0;
            return;
        }
        if (typeof fn === 'function') {
            this._readyListeners.push(fn);
        }
    };
    Module.has = function (name) {
        return moduleNames.indexOf(name) >= 0;
    };
    Module.modules = function () {
        return moduleNames.map(function (name) {
            return Module.module(name);
        });
    };
    Module.module = function (name, define, modules) {
        if (!name) {
            return;
        }
        if (define === void 0) {
            if (moduleNames.indexOf(name) === -1) {
                throw new Error('module : "' + name + '" not found !');
            }
            return moduleManager.getService(name);
        }
        if (moduleNames.indexOf(name) >= 0) {
            throw new Error('module : "' + name + '" has been defined !');
        }
        moduleManager.service(name, function () {
            var _modules = Module.ensureArray(modules).map(function (moduleName) {
                return Module.module(moduleName);
            });
            var m = new Module(_modules);
            Object.defineProperty(m, 'moduleName', {
                value: name
            });
            m.name(name);
            define.call(m);
            return m;
        });
        moduleNames.push(name);
        return Module;
    };
    return Module;
}(Injector));

var AppLoadRequest = {};
var Loaders$1 = {};
var AppLoader = (function (_super) {
    __extends(AppLoader, _super);
    function AppLoader(name) {
        _super.call(this, name);
        if (!Loaders$1[name]) {
            Loaders$1[name] = this;
        }
    }
    AppLoader.loader = function (name) {
        return Loaders$1[name];
    };
    AppLoader.prototype.item = function () {
        return Application.app(this.name);
    };
    AppLoader.prototype.loadRequest = function () {
        return AppLoadRequest;
    };
    return AppLoader;
}(Loader));

var Injector$1 = HERE.Injector;
var appNames = [];
var appManager = new Injector$1;
function defineDataProp(object) {
    var map = new HashMap();
    object.data = function (name, value) {
        return map.attr(name, value);
    };
}
var Application = (function (_super) {
    __extends(Application, _super);
    function Application() {
        this.appName = '';
        this.route = {};
        Module.apply(this, arguments);
        defineDataProp(this);
        delete this.moduleName;
    }
    Application.prototype.loader = function () {
        return AppLoader.loader(this.getIdentifier());
    };
    Application.prototype.getIdentifier = function () {
        return this.appName;
    };
    Application.apps = function () {
        return appNames.map(function (name) {
            return Application.app(name);
        });
    };
    Application.app = function (name, define, modules, apps) {
        if (!name) {
            return;
        }
        if (define === void 0) {
            if (appNames.indexOf(name) === -1) {
                throw new Error('application : "' + name + '" not found !');
            }
            return appManager.getService(name);
        }
        if (appNames.indexOf(name) >= 0) {
            throw new Error('application : "' + name + '" has been defined !');
        }
        appManager.service(name, function () {
            var _apps = Module.ensureArray(apps).map(function (appName) {
                return Application.app(appName);
            });
            var _modules = Module.ensureArray(modules).map(function (moduleName) {
                return Module.module(moduleName);
            });
            var app = new Application(_apps, _modules);
            Object.defineProperty(app, 'appName', {
                value: name
            });
            app.name(name);
            define.call(app);
            return app;
        });
        appNames.push(name);
        return Application;
    };
    return Application;
}(Module));

var ResourceLoader$1 = HERE.ResourceLoader;
var UrlModuleLoader = (function (_super) {
    __extends(UrlModuleLoader, _super);
    function UrlModuleLoader(name, url) {
        _super.call(this, name);
        this.url = '';
        this.assertField('url', this.url);
        this.url = url;
    }
    UrlModuleLoader.prototype.baseURI = function () {
        var url = this.url || '';
        var index = url.lastIndexOf('/');
        if (index >= 0) {
            return url.slice(0, index);
        }
        return '';
    };
    UrlModuleLoader.prototype.register = function () {
        return ResourceLoader$1.load({
            type: 'js',
            urls: [this.url]
        });
    };
    return UrlModuleLoader;
}(ModuleLoader));

var ResourceLoader$2 = HERE.ResourceLoader;
var UrlAppLoader = (function (_super) {
    __extends(UrlAppLoader, _super);
    function UrlAppLoader(name, url) {
        _super.call(this, name);
        this.url = '';
        this.assertField('url', this.url);
        this.url = url;
    }
    UrlAppLoader.prototype.baseURI = function () {
        var url = this.url || '';
        var index = url.lastIndexOf('/');
        if (index >= 0) {
            return url.slice(0, index);
        }
        return '';
    };
    UrlAppLoader.prototype.register = function () {
        return ResourceLoader$2.load({
            type: 'js',
            urls: [this.url]
        });
    };
    return UrlAppLoader;
}(AppLoader));

var Declare = (function (_super) {
    __extends(Declare, _super);
    function Declare(declare) {
        this.name = '';
        this.url = '';
        this.assign(['name', 'url'], declare);
        if (!this.name) {
            throw new Error('param "name" field is invalid !');
        }
        if (!this.url) {
            throw new Error('param "url" field is invalid !');
        }
    }
    return Declare;
}(Class));
function defineDeclares(object, name) {
    var _declares = [];
    object[name] = function (declares) {
        if (declares === void 0) {
            return _declares;
        }
        if (!(declares instanceof Array)) {
            declares = [declares];
        }
        var _declareMap = {};
        _declares = declares.map(function (declare) {
            var d = new Declare(declare);
            if (_declareMap[d.name]) {
                throw new Error(d.name + ' : more than one declare : ' + d.name + ' found !');
            }
            _declareMap[d.name] = true;
            return d;
        });
        return this;
    };
}
var creating = false;
var instance = null;
var runtime = {
    moduleNameMap: {},
    appNameMap: {}
};
var Register = (function () {
    function Register() {
        if (!creating) {
            throw new Error('constructor is private !');
        }
        defineDeclares(this, 'modules');
        defineDeclares(this, 'apps');
    }
    Register.getInstance = function () {
        if (instance) {
            return instance;
        }
        creating = true;
        instance = new Register();
        creating = false;
        return instance;
    };
    Register.prototype.addModule = function (declare) {
        this.modules().push(new Declare(declare));
        return this;
    };
    Register.prototype.addApp = function (declare) {
        this.apps().push(new Declare(declare));
        return this;
    };
    Register.prototype.register = function () {
        var _this = this;
        var modules = this.modules();
        var regModule = this.registerModule(modules).then(function () {
            _this.modules = _this.modules().filter(function (m) {
                return modules.indexOf(m) === -1;
            });
        });
        var apps = this.apps();
        var regApp = this.registerApp(apps).then(function () {
            _this.apps = _this.apps().filter(function (app) {
                return apps.indexOf(app) === -1;
            });
        });
        return Promise.all([regModule, regApp]);
    };
    Register.prototype.declares = function (name, url) {
        var declares = [];
        if (typeof name === 'string') {
            declares.push({
                name: name,
                url: url
            });
        }
        else if (name instanceof Array) {
            declares = declares.concat(name);
        }
        else if (typeof name === 'object') {
            declares.push(name);
        }
        return declares;
    };
    Register.prototype.registerModule = function (name, url) {
        var declares = this.declares(name, url);
        var nameMap = runtime.moduleNameMap;
        declares.forEach(function (_declare) {
            if (nameMap[_declare.name]) {
                throw new Error('module : "' + _declare.name + '" is reduplicated !');
            }
            if (Module.has(_declare.name)) {
                throw new TypeError('module : "' + _declare.name + '" has exist !');
            }
            nameMap[_declare.name] = true;
        });
        var promises = declares.map(function (_declare) {
            var loader = new UrlModuleLoader(_declare.name, _declare.url);
            return loader.register().then(function () {
                delete runtime.moduleNameMap[_declare.name];
            });
        });
        return Promise.all(promises);
    };
    Register.prototype.registerApp = function (name, url) {
        var declares = this.declares(name, url);
        var nameMap = runtime.appNameMap;
        declares.forEach(function (_declare) {
            if (nameMap[_declare.name]) {
                throw new Error('application : "' + _declare.name + '" is reduplicated !');
            }
            if (Application.has(_declare.name)) {
                throw new TypeError('application : "' + _declare.name + '" has exist !');
            }
            nameMap[_declare.name] = true;
        });
        var promises = declares.map(function (_declare) {
            var loader = new UrlAppLoader(_declare.name, _declare.url);
            return loader.register().then(function () {
                delete runtime.appNameMap[_declare.name];
            });
        });
        return Promise.all(promises);
    };
    return Register;
}());

exports.HashMap = HashMap;
exports.define = define;
exports.constant = constant;
exports.Location = Location;
exports.Module = Module;
exports.Application = Application;
exports.Register = Register;

Object.defineProperty(exports, '__esModule', { value: true });

})));
