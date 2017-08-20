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
            throw new Error('define name : ' + name + ' has been defined as constant !');
        }
        define[name] = define;
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
    defineObj.define.apply(defineObj, arguments);
};
var constant = function () {
    defineObj.constant.apply(defineObj, arguments);
};

var Http = (function () {
    function Http() {
    }
    Http.getJSON = function (url) {
        var resolve, reject;
        var promise = new Promise(function (_resolve, _reject) {
            resolve = _resolve;
            reject = _reject;
        });
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function () {
            var status = xhr.status;
            var isSuccess = status >= 200 && status < 300 || status === 304;
            if (isSuccess) {
                try {
                    resolve(JSON.parse(xhr.responseText));
                }
                catch (e) {
                    reject(e);
                }
            }
        };
        return promise;
    };
    return Http;
}());

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

(function initLnaguage() {
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

var moduleNames = [];
var moduleManager = new HERE.Injector();
var Resource = (function (_super) {
    __extends(Resource, _super);
    function Resource(resource) {
        this.js = [];
        this.css = [];
        this.langFiles = [];
        this.jsSerial = false;
        this.cssSerial = false;
        this.assign(['baseURI', 'js', 'jsSerial', 'cssSerial'], resource);
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
function parseLangFile(file) {
    var index = file.lastIndexOf('.');
    var fileName = file.slice(0, index);
    var lang = getLanguage();
    if (lang) {
        fileName = fileName + '_' + lang;
    }
    return fileName + file.slice(index);
}
function load(module) {
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
    var loader = new HERE.ResourceLoader({
        baseURI: module.baseURI()
    });
    promises.push(module.loadLangResource());
    var p = Promise.all(promises);
    p = p.then(function () {
        return loader.load(resources);
    });
    return p;
}
var Module = (function (_super) {
    __extends(Module, _super);
    function Module(parents) {
        _super.call(this, parents);
        this.description = '';
        this.loaded = false;
        this._readyListeners = [];
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
    Module.prototype.location = function () {
        return Location.locate(Module, this.moduleName);
    };
    Module.prototype.baseURI = function () {
        var url = this.location();
        if (!url) {
            return '';
        }
        var index = url.lastIndexOf('/');
        if (index >= 0) {
            return url.slice(0, index);
        }
        return '';
    };
    Module.prototype.parseUrl = function (url) {
        return HERE.ResourceUrl.parseUrl(this.baseURI(), url);
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
    Module.prototype.loadLangResource = function () {
        var module = this;
        var _resource = this.resource;
        return Promise.all(_resource.langFiles.map(function (file) {
            var url = module.parseUrl(parseLangFile(file));
            return Http.getJSON(url).then(function (data) {
                return data;
            }, function () {
                console.error('lang file : ' + url + ' load error !');
            });
        })).then(function (dataList) {
            dataList.forEach(function (data) {
                if (data) {
                    module.langResource.addResource(data);
                }
            });
        });
    };
    Module.prototype.load = function () {
        var _this = this;
        var promise = new Promise(function (resolve, reject) {
            if (_this.loaded) {
                resolve();
                return;
            }
            var p = load(_this);
            p.then(function (result) {
                _this.loaded = true;
                _this.ready();
                resolve(result);
            }, function (e) {
                reject(e);
            });
        });
        return promise;
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
                throw new Error('module : ' + name + ' not found !');
            }
            return moduleManager.getService(name);
        }
        if (moduleNames.indexOf(name) >= 0) {
            throw new Error('module : ' + name + ' has been defined !');
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
}(HERE.Injector));

var appNames = [];
var appManager = new HERE.Injector();
var Application = (function (_super) {
    __extends(Application, _super);
    function Application() {
        _super.call(this, arguments);
        this.appName = '';
        this.route = {};
    }
    Application.prototype.location = function () {
        return Location.locate(Application, this.appName);
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
                throw new Error('application : ' + name + ' not found !');
            }
            return appManager.getService(name);
        }
        if (appNames.indexOf(name) >= 0) {
            throw new Error('application : ' + name + ' has been defined !');
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
    Object.defineProperty(object, name, {
        set: function (declares) {
            if (!declares) {
                return;
            }
            if (!(declares instanceof Array)) {
                declares = [declares];
            }
            var _declareMap = {};
            _declares = declares.map(function (declare) {
                var d = new Declare(declare);
                if (_declareMap[d.name]) {
                    throw new Error(name + ' : more than one declare : ' + d.name + ' found !');
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
var creating = false;
var instance = null;
var Register = (function () {
    function Register() {
        this.main = '';
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
    Register.prototype.registerModule = function (declare) {
        this.modules.push(new Declare(declare));
    };
    Register.prototype.unRegisterModule = function (declare) {
        var name = declare.name;
        var modules = this.modules.filter(function (m) {
            return m.name !== name;
        });
        if (modules.length !== this.modules.length) {
            this.modules = modules;
        }
    };
    Register.prototype.registerApp = function (declare) {
        this.apps.push(new Declare(declare));
    };
    Register.prototype.unRegisterApp = function (declare) {
        var name = declare.name;
        var apps = this.apps.filter(function (m) {
            return m.name !== name;
        });
        if (apps.length !== this.apps.length) {
            this.apps = apps;
        }
    };
    Register.prototype.load = function () {
        var urls = [];
        this.modules.forEach(function (declare) {
            Location.locate(Module, declare.name, declare.url);
            urls.push(declare.url);
        });
        this.apps.forEach(function (declare) {
            Location.locate(Application, declare.name, declare.url);
            urls.push(declare.url);
        });
        var resource = {
            type: 'js',
            urls: urls
        };
        var mainResource = {
            type: 'js',
            urls: [],
            dependence: resource
        };
        if (this.main) {
            mainResource.urls.push(this.main);
        }
        return HERE.ResourceLoader.load(mainResource);
    };
    return Register;
}());

exports.define = define;
exports.constant = constant;
exports.Http = Http;
exports.Location = Location;
exports.Module = Module;
exports.Application = Application;
exports.Register = Register;

Object.defineProperty(exports, '__esModule', { value: true });

})));
