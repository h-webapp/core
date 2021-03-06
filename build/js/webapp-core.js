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

var LoaderEnvModel;
(function (LoaderEnvModel) {
    LoaderEnvModel[LoaderEnvModel["PRODUCT"] = 'product'] = "PRODUCT";
    LoaderEnvModel[LoaderEnvModel["DEVELOP"] = 'develop'] = "DEVELOP";
})(LoaderEnvModel || (LoaderEnvModel = {}));
var nextId = (function () {
    var id = 1;
    return function () {
        return id++;
    };
})();
/**
 * base abstract class loader
 */
var Loader = (function () {
    function Loader(option) {
        this.option = {
            url: ''
        };
        this.timestamp = nextId();
        if (option) {
            Object.assign(this.option, option);
        }
    }
    Loader.prototype.finalURL = function () {
        var url = this.option.url;
        var params = Object.assign({}, Loader.GlobalParam);
        var userParams = this.option.params;
        if (userParams) {
            Object.assign(params, userParams);
        }
        var queryArray = Array();
        var keys = Object.keys(params);
        keys.sort(function (v1, v2) {
            if (v1 > v2) {
                return 1;
            }
            else if (v1 < v2) {
                return -1;
            }
            return 0;
        });
        keys.forEach(function (name) {
            var value = params[name];
            if (value) {
                queryArray.push(name + '=' + value);
            }
        });
        if (queryArray.length === 0) {
            return url;
        }
        var queryString = queryArray.join('&');
        if (this.option.url.indexOf('?') === -1) {
            queryString = '?' + queryString;
        }
        else if (!url.endsWith('&')) {
            queryString = '&' + queryString;
        }
        url = url + queryString;
        return url;
    };
    Loader.prototype.createLoadEvent = function (state) {
        if (state === void 0) { state = 'success'; }
        return {
            state: state,
            url: this.finalURL()
        };
    };
    Loader.prototype.timeout = function (queueManager, call) {
        var _this = this;
        if (typeof this.option.timeout === 'number') {
            setTimeout(function () {
                var req = queueManager.getQueue(_this.finalURL());
                if (!req) {
                    return;
                }
                var index = req.calls.indexOf(call);
                if (index >= 0) {
                    req.calls.splice(index, 1);
                    call.reject(_this.createLoadEvent('timeout'));
                }
            }, this.option.timeout);
        }
    };
    Loader.ENV_MODE = LoaderEnvModel.PRODUCT;
    Loader.GlobalParam = {};
    return Loader;
}());

var urlDom = document.createElement('a');
var ResourceUrl = (function () {
    function ResourceUrl() {
    }
    ResourceUrl.parseUrl = function (baseURI, url) {
        if (!url) {
            url = '';
        }
        urlDom.href = url;
        if (!baseURI) {
            return urlDom.href;
        }
        if (url.match(/^\//)) {
            return urlDom.href;
        }
        urlDom.href = url;
        if (urlDom.href === url || urlDom.href === url + '/') {
            return url;
        }
        urlDom.href = baseURI;
        var prefixUrl = urlDom.href;
        prefixUrl = prefixUrl.replace(/\/+$/, '');
        url = url.replace(/^\/+/, '');
        return prefixUrl + '/' + url;
    };
    return ResourceUrl;
}());

var RequestQueueManager = (function () {
    function RequestQueueManager() {
        Object.defineProperty(this, 'requestQueues', {
            value: {}
        });
    }
    RequestQueueManager.prototype.executeQueue = function (key, type, data) {
        var request = this.requestQueues[key];
        if (!request) {
            return;
        }
        request.execute(type, data);
    };
    RequestQueueManager.prototype.putQueue = function (key, request) {
        this.requestQueues[key] = request;
    };
    RequestQueueManager.prototype.getQueue = function (key) {
        return this.requestQueues[key] || null;
    };
    RequestQueueManager.prototype.removeQueue = function (key) {
        var queue = this.requestQueues[key];
        delete this.requestQueues[key];
        return queue;
    };
    return RequestQueueManager;
}());
var RequestQueue = (function () {
    function RequestQueue(option) {
        if (option === void 0) { option = {}; }
        this.status = 0;
        this.data = null;
        this.calls = [];
        if (option.status) {
            this.status = option.status;
        }
        if (option.data) {
            this.data = option.data;
        }
        if (option.calls) {
            this.calls = option.calls;
        }
    }
    RequestQueue.prototype.execute = function (type, data) {
        this.data = data;
        if (type === 'resolve') {
            this.status = 1;
        }
        else if (type === 'reject') {
            this.status = 2;
            console.error(data);
        }
        this.calls.forEach(function (call) {
            var fn = call[type];
            try {
                fn(data);
            }
            catch (e) {
                console.error(e);
            }
        });
        this.calls.length = 0;
    };
    return RequestQueue;
}());

function wrapperFn(fn) {
    return function () {
        fn.apply(this, arguments);
    };
}
/**
 * base abstract class loader
 */
var ElementLoader = (function (_super) {
    __extends(ElementLoader, _super);
    function ElementLoader(option) {
        _super.call(this, option);
        this.el = null;
    }
    ElementLoader.prototype.isExistEl = function () {
        return false;
    };
    
    ElementLoader.prototype.createLoadEvent = function (state) {
        if (state === void 0) { state = 'success'; }
        return {
            state: state,
            url: this.finalURL(),
            target: this.el
        };
    };
    ElementLoader.prototype.appendAttributes = function (el) {
        if (!el) {
            return;
        }
        var attributes = this.option.attributes || {};
        Object.keys(attributes).forEach(function (key) {
            if (typeof key !== 'string') {
                return;
            }
            var value = attributes[key];
            if (['number', 'boolean', 'string'].indexOf(typeof value) >= 0) {
                el.setAttribute(key, String(value));
            }
        });
    };
    ElementLoader.prototype.load = function () {
        return this._load();
    };
    /**
     * start load
     * @returns {Promise<T>}
     */
    ElementLoader.prototype._load = function () {
        var _this = this;
        this.createDom();
        var el = this.el;
        this.appendAttributes(el);
        var onLoadFn, onErrorFn;
        var promise = new Promise(function (resolve, reject) {
            onLoadFn = wrapperFn(resolve);
            onErrorFn = wrapperFn(reject);
        });
        el.onload = el['onreadystatechange'] = function () {
            var stateText = el['readyState'];
            if (stateText && !/^c|loade/.test(stateText))
                return;
            onLoadFn(_this.createLoadEvent('success'));
            el.onload = el['onreadystatechange'] = null;
        };
        el.onerror = function () {
            var comment = document.createComment('Loader load error, Url: ' + _this.option.url + ' ,loadTime:' + (new Date()));
            if (el.parentNode) {
                el.parentNode.replaceChild(comment, el);
            }
            onErrorFn(_this.createLoadEvent('error'));
        };
        this.appendToDom(el);
        return promise;
    };
    return ElementLoader;
}(Loader));

var jsQueueManager = new RequestQueueManager();
var JsLoader = (function (_super) {
    __extends(JsLoader, _super);
    function JsLoader() {
        _super.apply(this, arguments);
    }
    JsLoader.prototype.isExistEl = function () {
        var url = this.finalURL();
        url = ResourceUrl.parseUrl('', url);
        var scripts = Array.prototype.slice.call(document.getElementsByTagName('script'), 0);
        return scripts.some(function (scr) {
            var src = scr.src;
            if (!src) {
                return;
            }
            src = ResourceUrl.parseUrl('', src);
            if (src === url) {
                return true;
            }
        });
    };
    JsLoader.prototype.appendToDom = function (el) {
        document.head.appendChild(el);
    };
    JsLoader.prototype.createDom = function () {
        var el = document.createElement('script');
        el.src = this.finalURL();
        this.el = el;
    };
    JsLoader.prototype.load = function (force) {
        if (force === void 0) { force = false; }
        if (force) {
            return this._load();
        }
        var url = this.finalURL();
        var request = jsQueueManager.getQueue(url);
        var resolve = null, reject = null;
        var call = {
            resolve: resolve,
            reject: reject
        };
        var p = new Promise(function (_resolve, _reject) {
            call.resolve = resolve = _resolve;
            call.reject = reject = _reject;
        });
        if (!request) {
            if (this.isExistEl()) {
                resolve(this.createLoadEvent('success'));
                return p;
            }
            request = new RequestQueue({
                calls: [call]
            });
            jsQueueManager.putQueue(url, request);
        }
        else {
            if (request.status === 1) {
                resolve(request.data);
            }
            else if (request.status === 2) {
                reject(request.data);
            }
            else {
                request.calls.push(call);
            }
            return p;
        }
        this._load().then(function (result) {
            jsQueueManager.executeQueue(url, 'resolve', result);
        }, function (e) {
            jsQueueManager.executeQueue(url, 'reject', e);
        });
        this.timeout(jsQueueManager, call);
        return p;
    };
    JsLoader.prototype._load = function () {
        var _this = this;
        return _super.prototype._load.call(this).then(function (d) {
            if (Loader.ENV_MODE === LoaderEnvModel.PRODUCT && _this.el) {
                try {
                    _this.el.parentNode.removeChild(_this.el);
                }
                catch (e) { }
            }
            return d;
        });
    };
    return JsLoader;
}(ElementLoader));

var cssQueueManager = new RequestQueueManager();
var CssLoader = (function (_super) {
    __extends(CssLoader, _super);
    function CssLoader() {
        _super.apply(this, arguments);
    }
    CssLoader.prototype.isExistEl = function () {
        var url = this.finalURL();
        url = ResourceUrl.parseUrl('', url);
        var links = Array.prototype.slice.call(document.getElementsByTagName('link'), 0);
        return links.some(function (lnk) {
            var href = lnk.href;
            if (!href) {
                return;
            }
            href = ResourceUrl.parseUrl('', href);
            if (href === url) {
                return true;
            }
        });
    };
    CssLoader.prototype.appendToDom = function (el) {
        document.head.appendChild(el);
    };
    CssLoader.prototype.createDom = function () {
        this.el = document.createElement('link');
        this.el.type = 'text/css';
        this.el.rel = 'stylesheet';
        this.el['href'] = this.finalURL();
    };
    CssLoader.prototype.isUseCssLoadPatch = function () {
        var useCssLoadPatch = false;
        var ua = navigator.userAgent.toLowerCase();
        if (/iP(hone|od|ad)/.test(navigator.platform)) {
            var v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
            var iOSVersion = parseFloat([parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)].join('.'));
            useCssLoadPatch = iOSVersion < 6;
        }
        else if (ua.indexOf("android") > -1) {
            // Android < 4.4
            var androidVersion = parseFloat(ua.slice(ua.indexOf("android") + 8));
            useCssLoadPatch = androidVersion < 4.4;
        }
        else if (ua.indexOf('safari') > -1) {
            var versionMatch = ua.match(/version\/([\.\d]+)/i);
            useCssLoadPatch = versionMatch && versionMatch[1] && parseFloat(versionMatch[1]) < 6;
        }
        return useCssLoadPatch;
    };
    CssLoader.prototype.checkUseCssLoadPatch = function () {
        var _this = this;
        var el = this.el;
        if (!el) {
            return;
        }
        var startTime = (new Date()).getTime();
        var timeout = this.option.timeout;
        if (this.isUseCssLoadPatch()) {
            var checkLoad = function () {
                if (timeout && (new Date()).getTime() - startTime > timeout) {
                    cssQueueManager.executeQueue(_this.finalURL(), 'reject', _this.createLoadEvent('timeout'));
                    return;
                }
                if (el.sheet) {
                    cssQueueManager.executeQueue(_this.finalURL(), 'resolve', _this.createLoadEvent('success'));
                }
                else {
                    setTimeout(checkLoad, 20);
                }
            };
            checkLoad();
        }
    };
    CssLoader.prototype._load = function () {
        var result = _super.prototype._load.call(this);
        this.checkUseCssLoadPatch();
        return result;
    };
    CssLoader.prototype.load = function (force) {
        var _this = this;
        if (force === void 0) { force = false; }
        if (force) {
            return this._load();
        }
        var url = this.finalURL();
        var request = cssQueueManager.getQueue(url);
        var resolve = null, reject = null;
        var call = {
            resolve: resolve,
            reject: reject
        };
        var p = new Promise(function (_resolve, _reject) {
            call.resolve = resolve = _resolve;
            call.reject = reject = _reject;
        });
        var isExistEl = this.isExistEl();
        if (isExistEl) {
            if (request) {
                if (request.status === 1) {
                    resolve(request.data);
                }
                else if (request.status === 2) {
                    reject(request.data);
                }
                else {
                    request.calls.push(call);
                }
            }
            else {
                resolve(this.createLoadEvent('success'));
            }
            return p;
        }
        else {
            if (!request) {
                request = new RequestQueue();
                cssQueueManager.putQueue(url, request);
            }
            else {
                request.status = 0;
            }
            request.calls.push(call);
        }
        this._load().then(function (result) {
            if (_this.isExistEl()) {
                cssQueueManager.executeQueue(url, 'resolve', result);
            }
        }, function (e) {
            if (_this.isExistEl()) {
                cssQueueManager.executeQueue(url, 'reject', e);
            }
        });
        this.timeout(cssQueueManager, call);
        return p;
    };
    return CssLoader;
}(ElementLoader));

function polyfill() {
    if (!Object.assign) {
        Object.assign = function (src, target) {
            if (!target) {
                return src;
            }
            Object.keys(target).forEach(function (key) {
                src[key] = target[key];
            });
            return src;
        };
    }
}

var textQueueManager = new RequestQueueManager();
var TextLoader = (function (_super) {
    __extends(TextLoader, _super);
    function TextLoader() {
        _super.apply(this, arguments);
    }
    TextLoader.prototype.load = function () {
        var resolve = null, reject = null;
        var call = {
            resolve: null,
            reject: null
        };
        var promise = new Promise(function (_resolve, _reject) {
            call.resolve = resolve = _resolve;
            call.reject = reject = _reject;
        });
        var url = this.finalURL();
        var request = textQueueManager.getQueue(url);
        if (!request) {
            request = new RequestQueue({
                calls: [call]
            });
            textQueueManager.putQueue(url, request);
        }
        else {
            if (request.status === 0) {
                request.calls.push(call);
                return promise;
            }
        }
        this._load().then(function (result) {
            textQueueManager.executeQueue(url, 'resolve', result);
            textQueueManager.removeQueue(url);
        }, function (e) {
            textQueueManager.executeQueue(url, 'reject', e);
            textQueueManager.removeQueue(url);
        });
        this.timeout(textQueueManager, call);
        return promise;
    };
    TextLoader.prototype._load = function () {
        var _this = this;
        var url = this.finalURL();
        var resolve, reject;
        var promise = new Promise(function (_resolve, _reject) {
            resolve = _resolve;
            reject = _reject;
        });
        var xhr = new XMLHttpRequest();
        try {
            xhr.open('GET', url, true);
            xhr['onreadystatechange'] = function () {
                if (xhr.readyState !== 4) {
                    return;
                }
                var status = xhr.status;
                var isSuccess = status >= 200 && status < 300 || status === 304;
                if (isSuccess) {
                    resolve(xhr.responseText);
                }
                else {
                    reject(_this.createLoadEvent('error'));
                }
            };
            xhr.send();
        }
        catch (e) {
            console.error(e);
            reject && reject(this.createLoadEvent('error'));
        }
        return promise;
    };
    return TextLoader;
}(Loader));

var JsonLoader = (function (_super) {
    __extends(JsonLoader, _super);
    function JsonLoader(option) {
        _super.call(this, option);
    }
    JsonLoader.prototype.load = function () {
        return _super.prototype.load.call(this).then(function (data) {
            return JSON.parse(data);
        });
    };
    return JsonLoader;
}(TextLoader));

var ImageLoader = (function (_super) {
    __extends(ImageLoader, _super);
    function ImageLoader(option) {
        _super.call(this, option);
    }
    ImageLoader.prototype.appendToDom = function (el) {
    };
    ImageLoader.prototype.createDom = function () {
        this.el = document.createElement('img');
        this.el.src = this.finalURL();
    };
    return ImageLoader;
}(ElementLoader));

polyfill();
function isFunction(fn) {
    return typeof fn === 'function';
}
var loaders = {
    js: JsLoader,
    css: CssLoader,
    text: TextLoader,
    json: JsonLoader,
    image: ImageLoader
};
loaders = Object.create(loaders);
var LoaderEvent;
(function (LoaderEvent) {
    LoaderEvent[LoaderEvent["LoadStart"] = 'loadStart'] = "LoadStart";
    LoaderEvent[LoaderEvent["LoadFinished"] = 'loadFinished'] = "LoadFinished";
    LoaderEvent[LoaderEvent["LoadError"] = 'loadError'] = "LoadError";
})(LoaderEvent || (LoaderEvent = {}));
var ResourceLoader = (function () {
    function ResourceLoader(option) {
        this.option = {};
        if (option) {
            Object.assign(this.option, option);
        }
    }
    ResourceLoader.triggerLoadEvent = function (eventType, target) {
        var listeners = ResourceLoader.loadEventListener[eventType];
        listeners && listeners.forEach(function (fn) {
            try {
                fn(target);
            }
            catch (e) {
                console.error(e);
            }
        });
    };
    ResourceLoader.registerLoader = function (type, loader) {
        loaders[type] = loader;
        return ResourceLoader;
    };
    
    ResourceLoader.prototype.initTimeoutEvent = function () {
        var evt = document.createEvent('CustomEvent');
        evt.initEvent('timeout', false, false);
        return evt;
    };
    ResourceLoader.prototype.load = function (resource) {
        var _this = this;
        var other = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            other[_i - 1] = arguments[_i];
        }
        var loadEvents = [];
        var loadFn = function (resource) {
            var other = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                other[_i - 1] = arguments[_i];
            }
            var promises = [];
            if (resource) {
                if (!(resource instanceof Array)) {
                    promises.push(_this._loadResource(resource, loadEvents));
                }
                else {
                    resource.forEach(function (resource) {
                        promises.push(_this._loadResource(resource, loadEvents));
                    });
                }
            }
            var promise = Promise.all(promises);
            other.forEach(function (resource) {
                if (!resource) {
                    return;
                }
                promise = promise.then(function () {
                    var _resource = Object.create(resource);
                    return loadFn(_resource);
                });
            });
            return promise;
        };
        var params = arguments;
        return new Promise(function (resolve, reject) {
            loadFn.apply(this, params).then(function () {
                resolve(loadEvents);
            }, function (result) {
                reject(result);
            });
        });
    };
    ResourceLoader.prototype._loadResource = function (resource, loadEvents) {
        if (loadEvents === void 0) { loadEvents = []; }
        var timeout = this.option.timeout;
        var promise = this.__load(resource, loadEvents);
        if (!timeout) {
            return promise;
        }
        return new Promise(function (resolve, reject) {
            var isDirty = false;
            var timeoutId = setTimeout(function () {
                isDirty = true;
                reject(this.initTimeoutEvent());
            }, timeout);
            promise.then(function (d) {
                clearTimeout(timeoutId);
                !isDirty && resolve(d);
            }, function (d) {
                clearTimeout(timeoutId);
                !isDirty && reject(d);
            });
        });
    };
    ResourceLoader.prototype.parseUrl = function (url) {
        return ResourceUrl.parseUrl(this.option.baseURI, url);
    };
    ResourceLoader.prototype.__load = function (resource, loadEvents) {
        var _this = this;
        var promise;
        if (resource.dependence) {
            if (resource.dependence instanceof Array) {
                promise = Promise.all(resource.dependence.map(function (dependence) {
                    return this.__load(dependence, loadEvents);
                }.bind(this)));
            }
            else {
                promise = this.__load(resource.dependence, loadEvents);
            }
        }
        var initiateLoader = function (url) {
            var _url = _this.parseUrl(url);
            var type = resource.type;
            if (type) {
                type = type.toLowerCase();
            }
            var loaderFn = loaders[type];
            if (!loaderFn) {
                throw new Error('resource type is not support !');
            }
            var params = Object.assign({}, _this.option.params);
            Object.assign(params, resource.params);
            var loader = new loaderFn({
                url: _url,
                params: params,
                attributes: resource.attributes,
                timeout: resource.timeout
            });
            return loader;
        };
        function functionExecutor(param) {
            if (typeof param === 'function') {
                param = param();
            }
            return param;
        }
        function isPromise(param) {
            return typeof param === 'object' && typeof param.then === 'function';
        }
        function triggerLoadEvent(_promise, target) {
            return new Promise(function (resolve, reject) {
                ResourceLoader.triggerLoadEvent(LoaderEvent.LoadStart, target);
                _promise.then(function (result) {
                    loadEvents.push(result);
                    resolve(result);
                    ResourceLoader.triggerLoadEvent(LoaderEvent.LoadFinished, target);
                }, function (result) {
                    reject(result);
                    ResourceLoader.triggerLoadEvent(LoaderEvent.LoadError, target);
                });
            });
        }
        function loaderLoad(loader) {
            var target = {
                url: loader.finalURL()
            };
            return triggerLoadEvent(loader.load(), target);
        }
        function promiseThen(_promise) {
            var target = {
                url: _promise
            };
            if (typeof _promise === 'function') {
                _promise = _promise();
            }
            return triggerLoadEvent(_promise, target);
        }
        function initPromises() {
            var promises = [];
            if (resource.serial) {
                resource.urls.forEach(function (url) {
                    if (isPromise(url) || isFunction(url)) {
                        if (promises.length > 0) {
                            promises[0] = promises[0].then(function () {
                                return promiseThen(url);
                            });
                        }
                        else {
                            promises.push(promiseThen(url));
                        }
                    }
                    else {
                        var loader = initiateLoader(url);
                        if (promises.length > 0) {
                            promises[0] = promises[0].then(function () {
                                return loaderLoad(loader);
                            });
                        }
                        else {
                            promises.push(loaderLoad(loader));
                        }
                    }
                });
            }
            else {
                resource.urls.forEach(function (url) {
                    if (isPromise(url) || isFunction(url)) {
                        promises.push(promiseThen(url));
                    }
                    else {
                        promises.push(loaderLoad(initiateLoader(url)));
                    }
                });
            }
            return promises;
        }
        if (promise) {
            promise = promise.then(function () {
                return Promise.all(initPromises());
            });
        }
        else {
            promise = Promise.all(initPromises());
        }
        return promise;
    };
    ResourceLoader.loadEventListener = {};
    ResourceLoader.addEventListener = function (eventType, handler) {
        var listeners = ResourceLoader.loadEventListener[eventType] || [];
        if (isFunction(handler) && listeners.indexOf(handler) === -1) {
            listeners.push(handler);
            ResourceLoader.loadEventListener[eventType] = listeners;
        }
    };
    ResourceLoader.removeEventListener = function (eventType, handler) {
        var listeners = ResourceLoader.loadEventListener[eventType] || [];
        var index = listeners.indexOf(handler);
        if (index >= 0) {
            listeners.splice(index, 1);
        }
    };
    ResourceLoader.load = function (resource) {
        var other = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            other[_i - 1] = arguments[_i];
        }
        var loader = new ResourceLoader();
        return loader.load.apply(loader, arguments);
    };
    return ResourceLoader;
}());

var util;
(function (util) {
    function template(text) {
        var args = Array.prototype.slice.call(arguments, 1);
        return text.replace(/\{\s*(\d+)\s*\}/g, function (all, argIndex) {
            return args[argIndex] || '';
        });
    }
    util.template = template;
    function error(text) {
        var text = template.apply(this, arguments);
        var e = new Error(text);
        throw e;
    }
    util.error = error;
    function isObject(value) {
        return value !== null && typeof value === 'object';
    }
    util.isObject = isObject;
    util.isArray = Array.isArray || function (array) {
        return array instanceof Array;
    };
    function isBoolean(value) {
        return typeof value === 'boolean';
    }
    util.isBoolean = isBoolean;
    function isString(value, throwError) {
        var result = typeof value === 'string';
        if (!result && throwError) {
            error('arg {0} must be string type !', value);
        }
        return result;
    }
    util.isString = isString;
    function isFunction(fn) {
        return typeof fn === 'function';
    }
    util.isFunction = isFunction;
    function forEach(obj, iterator, context) {
        Object.keys(obj).forEach(function (key) {
            var value = obj[key];
            iterator.call(context, value, key);
        });
    }
    util.forEach = forEach;
    function _nextId() {
        var _id = 1;
        return function () {
            return _id++;
        };
    }
    util._nextId = _nextId;
    function nextInjectorNameFn() {
        var nextId = _nextId();
        return function () {
            return 'injector_' + nextId();
        };
    }
    util.nextInjectorNameFn = nextInjectorNameFn;
    function enforceFunction(fn) {
        if (!isFunction(fn)) {
            error('define must be a function !');
        }
        return fn;
    }
    util.enforceFunction = enforceFunction;
    function enforceReturnFunction(fn) {
        if (isFunction(fn)) {
            return fn;
        }
        return function () {
            return fn;
        };
    }
    util.enforceReturnFunction = enforceReturnFunction;
})(util || (util = {}));
var util$1 = util;

var ArrayList = (function () {
    function ArrayList(list) {
        if (list === void 0) { list = []; }
        this.__list__ = [];
        Array.prototype.push.apply(this.__list__, list);
    }
    ArrayList.prototype.indexOf = function (value) {
        return this.__list__.indexOf(value);
    };
    ArrayList.prototype.has = function (value) {
        return this.indexOf(value) >= 0;
    };
    ArrayList.prototype.push = function (value) {
        return this.__list__.push(value);
    };
    ArrayList.prototype.pop = function () {
        return this.__list__.pop();
    };
    ArrayList.prototype.unshift = function (value) {
        return this.__list__.unshift(value);
    };
    ArrayList.prototype.shift = function () {
        return this.__list__.shift();
    };
    ArrayList.prototype.items = function () {
        return this.__list__;
    };
    ArrayList.prototype.remove = function (value) {
        var index = this.indexOf(value);
        if (index >= 0) {
            this.__list__.splice(index, 1);
            return value;
        }
    };
    ArrayList.prototype.empty = function () {
        this.__list__.length = 0;
    };
    return ArrayList;
}());

/**
 * injector collection
 * @param injectors
 * @constructor
 */
var Super = (function (_super) {
    __extends(Super, _super);
    function Super(items) {
        if (items === void 0) { items = []; }
        _super.call(this);
        Array.prototype.push.apply(this.__list__, items);
    }
    Super.prototype.invokeMethod = function (methodName, params) {
        var val = null;
        this.__list__.some(function (injector) {
            val = injector[methodName].apply(injector, params);
            return !!val;
        });
        return val;
    };
    return Super;
}(ArrayList));

var Cache = (function () {
    function Cache(parent) {
        this.parent = [];
        this.cache = {};
        if (parent) {
            this.parent = this.parent.concat(parent);
        }
    }
    Cache.prototype.get = function (key) {
        var value = this.cache[key];
        if (value) {
            return value;
        }
        this.parent.some(function (cache) {
            value = cache.get(key);
            return !!value;
        });
        return value;
    };
    Cache.prototype.put = function (key, value) {
        this.cache[key] = value;
    };
    Cache.prototype.remove = function (key) {
        delete this.cache[key];
    };
    Cache.prototype.has = function (key) {
        return this.cache.hasOwnProperty(key);
    };
    return Cache;
}());

/**
 * parser
 * parse function parameter
 * @type {RegExp}
 */
var ARROW_ARG = /^([^\(]+?)=>/;
var FN_ARGS = /^[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function extractParameter(fn) {
    var fnText = fn.toString().replace(STRIP_COMMENTS, '');
    var args = fnText.match(ARROW_ARG) || fnText.match(FN_ARGS);
    var $injector = [];
    args[1].split(FN_ARG_SPLIT).forEach(function (arg) {
        arg.replace(FN_ARG, function (all, fix, name) {
            $injector.push(name);
        });
    });
    return $injector;
}

function enforceDefineFn(define) {
    var $injector = [], defineFn = null;
    if (util$1.isArray(define)) {
        defineFn = define.pop();
        util$1.enforceFunction(defineFn);
        $injector = define.slice();
    }
    else {
        defineFn = define;
        util$1.enforceFunction(defineFn);
        $injector = Injector.depInjector(defineFn) || (Injector.debugMode() ? extractParameter(define) : []);
    }
    Injector.depInjector(defineFn, $injector);
    return defineFn;
}
function initDefineFnWithParams(name, define) {
    var defineFn;
    if (!define) {
        define = name;
        name = null;
    }
    defineFn = enforceDefineFn(define);
    var $injectorName = Injector.identify(defineFn) ? String(Injector.identify(defineFn)) : null;
    $injectorName = name || $injectorName || nextInjectorName();
    Injector.identify(defineFn, $injectorName);
    return defineFn;
}
function initGetParam(val) {
    if (util$1.isFunction(val)) {
        return Injector.identify(val);
    }
    if (util$1.isString(val)) {
        return val;
    }
    util$1.error('arg : {0} is invalid !', val);
}
var nextInjectorName = util$1.nextInjectorNameFn();
function createInjector() {
    var providerCache = new Cache(), instanceCache = new Cache();
    var serviceIndex = Object.create(null), valueIndex = Object.create(null);
    function invokeFunction(method, context, params) {
        var fn = context[method];
        return fn.apply(context, params);
    }
    function initiate(defineFn, getFn, fnInit) {
        var _this = this;
        var args = (Injector.depInjector(defineFn) || []).map(function (dep) {
            var depValue = getFn.call(_this, dep);
            if (!depValue) {
                util$1.error('Dependence : {0} not found !', dep);
            }
            return depValue;
        });
        if (fnInit) {
            return (Function.prototype.bind.apply(defineFn, [null].concat(args)))();
        }
        return new (Function.prototype.bind.apply(defineFn, [null].concat(args)))();
    }
    function providerNameSuffix(name) {
        var providerSuffix = '_$Provider';
        return name + providerSuffix;
    }
    function getProvider(name) {
        var providerName = providerNameSuffix(name);
        var provider = providerCache.get(providerName);
        return provider || null;
    }
    var initPath = new ArrayList();
    function getFactory(name) {
        name = initGetParam(name);
        var provider = this['getProvider'](name);
        if (!provider) {
            return null;
        }
        if (initPath.has(name)) {
            util$1.error('Circular dependence: {0} ' + initPath.items().join(' <-- '));
        }
        initPath.unshift(name);
        try {
            var factory = invokeFunction('$get', provider, undefined);
            return factory || null;
        }
        finally {
            initPath.shift();
        }
    }
    function getService(arg) {
        var service;
        var name = initGetParam(arg);
        service = instanceCache.get(name);
        var isServiceDefine = serviceIndex[name];
        if (!existDefine(name) && !service) {
            service = this.parent.getService(name);
        }
        if (!service) {
            service = this['getFactory'](arg);
            isServiceDefine && instanceCache.put(name, service);
        }
        return service;
    }
    function getValue(name) {
        return this['getFactory'](name);
    }
    function existDefine(name) {
        name = initGetParam(name);
        var providerName = providerNameSuffix(name);
        return providerCache.has(providerName);
    }
    function assertNotExist(name) {
        name = initGetParam(name);
        if (existDefine(name)) {
            util$1.error('injector name : {0} has defined !', name);
        }
    }
    function provider(name, provider) {
        if (!util$1.isString(name)) {
            util$1.error('provider arg {0} name must be a string type !', name);
        }
        !valueIndex[name] && assertNotExist(name);
        var providerName = providerNameSuffix(name);
        var providerFn = null;
        if (util$1.isFunction(provider) || util$1.isArray(provider)) {
            providerFn = enforceDefineFn(provider);
        }
        else {
            providerFn = util$1.enforceReturnFunction(provider);
        }
        var _provider = initiate.call(this, providerFn, this['getProvider']);
        if (!util$1.isFunction(_provider['$get'])) {
            util$1.error('Provider must define a $get function !');
        }
        providerCache.put(providerName, _provider);
        return this;
    }
    function factory(name, define) {
        var _this = this;
        var factory = initDefineFnWithParams(name, define);
        return provider.call(this, Injector.identify(factory), {
            $get: function () {
                return initiate.call(_this, factory, _this['getFactory'], true);
            }
        });
    }
    function service(name, define) {
        var _this = this;
        var service = initDefineFnWithParams(name, define);
        name = Injector.identify(service);
        var result = factory.call(this, name, function () {
            return initiate.call(_this, service, _this['getService']);
        });
        serviceIndex[name] = true;
        return result;
    }
    function value(name, val) {
        util$1.isString(name, true);
        var result = factory.call(this, name, function () {
            return val;
        });
        valueIndex[name] = true;
        return result;
    }
    function invoke(define) {
        var factory = initDefineFnWithParams(undefined, define);
        return initiate.call(this, factory, this['getFactory'], true);
    }
    function invokeService(define) {
        var service = initDefineFnWithParams(undefined, define);
        return initiate.call(this, service, this['getService']);
    }
    return {
        invoke: invoke,
        invokeService: invokeService,
        provider: provider,
        value: value,
        service: service,
        factory: factory,
        getProvider: getProvider,
        getValue: getValue,
        getService: getService,
        getFactory: getFactory
    };
}

var CircularCheck = (function () {
    function CircularCheck() {
        this.__invoking__ = false;
    }
    CircularCheck.prototype.invoke = function (fn) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        if (this.__invoking__) {
            throw new Error('Circular invoked ' + this);
        }
        this.__invoking__ = true;
        var result = fn.apply(this, params);
        this.__invoking__ = false;
        return result;
    };
    return CircularCheck;
}());

var slice = Array.prototype.slice;
var InjectorId = util$1._nextId();
var _config = {
    debugMode: true,
    injectorIdentifyKey: '$injectorName',
    injectorDepIdentifyKey: '$injector'
};
var Injector = (function (_super) {
    __extends(Injector, _super);
    function Injector() {
        _super.call(this);
        var _name = util$1.template('InjectorInstance_{0}', InjectorId());
        this.name = function (name) {
            if (arguments.length === 0) {
                return _name;
            }
            _name = name;
            return this;
        };
        this.init.apply(this, arguments);
    }
    /**
     * debugMode check
     * @returns {boolean}
     */
    Injector.debugMode = function () {
        return _config.debugMode;
    };
    /**
     * config Injector global info
     * @param name
     * @param val
     * @returns {any}
     */
    Injector.config = function (name, val) {
        var config = {};
        if (arguments.length === 1) {
            if (util$1.isString(name)) {
                return _config[name];
            }
            else if (util$1.isObject(name)) {
                config = name;
            }
        }
        else {
            if (!util$1.isString(name)) {
                util$1.error('arg {0} is invalid !', name);
            }
            config[name] = val;
        }
        if (!val && util$1.isObject(name)) {
            config = name;
        }
        if (!config) {
            return;
        }
        Object.keys(config).forEach(function (key) {
            if (!_config.hasOwnProperty(key)) {
                return;
            }
            var val = config[key];
            if (typeof val === typeof _config[key]) {
                _config[key] = val;
            }
        });
    };
    Injector.identify = function (fn, value) {
        if (arguments.length === 1) {
            return fn[_config.injectorIdentifyKey];
        }
        if (arguments.length === 2) {
            fn[_config.injectorIdentifyKey] = value;
            return fn;
        }
    };
    Injector.depInjector = function (fn, injectors) {
        if (arguments.length === 1) {
            return fn[_config.injectorDepIdentifyKey];
        }
        var $injectors = [];
        function appendInjector(injector) {
            if (util$1.isArray(injector)) {
                injector.forEach(appendInjector);
            }
            else if (util$1.isString(injector) || util$1.isFunction(injector)) {
                $injectors.push(injector);
            }
            else {
                util$1.error('injector: {0} is invalid !' + injector);
            }
        }
        appendInjector(slice.call(arguments, 1));
        fn[_config.injectorDepIdentifyKey] = $injectors;
    };
    Injector.prototype.init = function () {
        var injectors = [];
        slice.call(arguments, 0).forEach(function (arg) {
            if (util$1.isArray(arg)) {
                arg.forEach(function (ar) {
                    if (ar instanceof Injector) {
                        injectors.push(ar);
                    }
                });
                return;
            }
            if (arg instanceof Injector) {
                injectors.push(arg);
            }
        });
        this.parent = new Super(injectors);
        this.extendMethod();
        Injector.freezeConfig();
    };
    Injector.prototype.extendMethod = function () {
        var _this = this;
        var injectorExtend = createInjector();
        Object.keys(injectorExtend).forEach(function (key) {
            _this[key] = injectorExtend[key];
        });
        ['getValue', 'getService', 'getFactory', 'getProvider'].forEach(function (methodName) {
            _this.parent[methodName] = function () {
                var params = slice.call(arguments, 0);
                return this.invokeMethod(methodName, params);
            };
            _this[methodName] = function () {
                var params = slice.call(arguments, 0);
                var val = injectorExtend[methodName].apply(this, params);
                if (val) {
                    return val;
                }
                return this.parent[methodName].apply(this.parent, params);
            };
        });
    };
    Injector.freezeConfig = function () {
        Injector.config = function (name) {
            if (arguments.length === 0) {
                return {
                    debugMode: _config.debugMode,
                    injectorIdentifyKey: _config.injectorIdentifyKey,
                    injectorDepIdentifyKey: _config.injectorDepIdentifyKey
                };
            }
            if (util$1.isString(name)) {
                return _config[name];
            }
        };
    };
    return Injector;
}(CircularCheck));

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
            attributes: _resource.attributes,
            serial: _resource.jsSerial,
            urls: Module.ensureArray(_resource.js)
        });
    }
    if (_resource.css.length > 0) {
        resources.push({
            type: 'css',
            attributes: _resource.attributes,
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
    var p;
    if (module.parallel === true) {
        promises.push(loader.load(resources));
        p = Promise.all(promises);
    }
    else {
        p = Promise.all(promises).then(function () {
            return loader.load(resources);
        });
    }
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
var Loader$1 = (function () {
    function Loader$$1(name) {
        this.name = '';
        this._baseURI = '';
        this.assertField('name', this.name);
        this.name = name;
    }
    Loader$$1.prototype.assertField = function (fieldName, type) {
        var value = this[fieldName];
        if (typeof value !== typeof type) {
            throw new TypeError('loader "' + fieldName + '" is not a "' + (typeof value) + '" type !');
        }
    };
    Loader$$1.prototype.baseURI = function (uri) {
        if (arguments.length === 0) {
            return this._baseURI;
        }
        if (!this._baseURI) {
            this._baseURI = uri;
        }
        else {
            console.warn('baseURI has been defined !');
        }
        return this._baseURI;
    };
    Loader$$1.prototype.parseUrl = function (url) {
        return ResourceUrl.parseUrl(this.baseURI(), url);
    };
    Loader$$1.prototype.loadResource = function (resources) {
        var loader = new ResourceLoader({
            baseURI: this.baseURI()
        });
        return loader.load.apply(loader, arguments);
    };
    Loader$$1.prototype.loadLangResource = function () {
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
    Loader$$1.prototype.loadRequest = function () {
        return ModuleLoadRequest$1;
    };
    Loader$$1.prototype.load = function () {
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
    return Loader$$1;
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
    ModuleLoader.forLoader = function (name) {
        var loader = ModuleLoader.loader(name);
        if (loader) {
            return loader;
        }
        return new ModuleLoader(name);
    };
    ModuleLoader.prototype.item = function () {
        return Module.module(this.name);
    };
    ModuleLoader.prototype.loadRequest = function () {
        return ModuleLoadRequest;
    };
    return ModuleLoader;
}(Loader$1));

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
        this.attributes = {};
        this.langFiles = [];
        this.jsSerial = false;
        this.cssSerial = false;
        this.assign(['js', 'css', 'jsSerial', 'cssSerial', 'langFiles', 'attributes'], resource);
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
var readyKey = Symbol('readyKey');
var Module = (function (_super) {
    __extends(Module, _super);
    function Module() {
        this.description = '';
        this.parallel = true;
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
        var _this = this;
        return this.loader().load().then(function () {
            try {
                _this.ready();
            }
            catch (e) {
                console.error(e);
            }
        });
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
            this[readyKey] = true;
            return;
        }
        if (typeof fn === 'function') {
            if (this[readyKey]) {
                fn.call(this);
            }
            else {
                this._readyListeners.push(fn);
            }
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
    Module.parseDependence = function (modules) {
        return Module.ensureArray(modules).map(function (moduleName) {
            if (moduleName instanceof Module) {
                return moduleName;
            }
            if (typeof moduleName === 'function') {
                return moduleName();
            }
            return Module.module(moduleName);
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
        ModuleLoader.forLoader(name);
        moduleManager.service(name, function () {
            var _modules = Module.parseDependence(modules);
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
    AppLoader.forLoader = function (name) {
        var loader = AppLoader.loader(name);
        if (loader) {
            return loader;
        }
        return new AppLoader(name);
    };
    AppLoader.prototype.item = function () {
        return Application.app(this.name);
    };
    AppLoader.prototype.loadRequest = function () {
        return AppLoadRequest;
    };
    return AppLoader;
}(Loader$1));

var appNames = [];
var appManager = new Injector;
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
    Application.has = function (name) {
        return appNames.indexOf(name) >= 0;
    };
    Application.parseDependence = function (apps) {
        return Module.ensureArray(apps).map(function (appName) {
            if (appName instanceof Application) {
                return appName;
            }
            if (typeof appName === 'function') {
                return appName();
            }
            return Application.app(appName);
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
        AppLoader.forLoader(name);
        appManager.service(name, function () {
            var _apps = Application.parseDependence(apps);
            var _modules = Module.parseDependence(modules);
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

var UrlModuleLoader = (function (_super) {
    __extends(UrlModuleLoader, _super);
    function UrlModuleLoader(name, url) {
        _super.call(this, name);
        this.url = '';
        this.assertField('url', this.url);
        this.url = url;
    }
    UrlModuleLoader.forLoader = function (name, url) {
        var loader = ModuleLoader.loader(name);
        if (loader) {
            if (!(loader instanceof UrlModuleLoader)) {
                throw new TypeError('loader is not a UrlModuleLoader instance !');
            }
            return loader;
        }
        return new UrlModuleLoader(name, url);
    };
    UrlModuleLoader.prototype.baseURI = function () {
        var url = this.url || '';
        var index = url.lastIndexOf('/');
        if (index >= 0) {
            return url.slice(0, index);
        }
        return '';
    };
    UrlModuleLoader.prototype.register = function () {
        return ResourceLoader.load({
            type: 'js',
            urls: [this.url]
        });
    };
    return UrlModuleLoader;
}(ModuleLoader));

var UrlAppLoader = (function (_super) {
    __extends(UrlAppLoader, _super);
    function UrlAppLoader(name, url) {
        _super.call(this, name);
        this.url = '';
        this.assertField('url', this.url);
        this.url = url;
    }
    UrlAppLoader.forLoader = function (name, url) {
        var loader = AppLoader.loader(name);
        if (loader) {
            if (!(loader instanceof UrlAppLoader)) {
                throw new TypeError('loader is not a UrlAppLoader instance !');
            }
            return loader;
        }
        return new UrlAppLoader(name, url);
    };
    UrlAppLoader.prototype.baseURI = function () {
        var url = this.url || '';
        var index = url.lastIndexOf('/');
        if (index >= 0) {
            return url.slice(0, index);
        }
        return '';
    };
    UrlAppLoader.prototype.register = function () {
        return ResourceLoader.load({
            type: 'js',
            urls: [this.url]
        });
    };
    return UrlAppLoader;
}(AppLoader));

var Declare = (function (_super) {
    __extends(Declare, _super);
    function Declare(declare) {
        _super.call(this);
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
        this.needLoad = true;
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
    Register.prototype.setNeedLoad = function (needLoad) {
        this.needLoad = needLoad;
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
        var modules = this.modules();
        this.modules([]);
        var regModule = this.registerModule(modules);
        var apps = this.apps();
        this.apps([]);
        var regApp = this.registerApp(apps);
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
            if (ModuleLoader.loader(_declare.name)) {
                throw new TypeError('module : "' + _declare.name + '" has exist !');
            }
            nameMap[_declare.name] = true;
        });
        runtime.moduleNameMap = {};
        var promises = declares.map(function (_declare) {
            var loader = UrlModuleLoader.forLoader(_declare.name, _declare.url);
            if (this.needLoad) {
                return loader.register();
            }
            return Promise.resolve();
        }.bind(this));
        return Promise.all(promises);
    };
    Register.prototype.registerApp = function (name, url) {
        var declares = this.declares(name, url);
        var nameMap = runtime.appNameMap;
        declares.forEach(function (_declare) {
            if (nameMap[_declare.name]) {
                throw new Error('application : "' + _declare.name + '" is reduplicated !');
            }
            if (AppLoader.loader(_declare.name)) {
                throw new TypeError('application : "' + _declare.name + '" has exist !');
            }
            nameMap[_declare.name] = true;
        });
        runtime.appNameMap = {};
        var promises = declares.map(function (_declare) {
            var loader = UrlAppLoader.forLoader(_declare.name, _declare.url);
            if (this.needLoad) {
                return loader.register();
            }
            return Promise.resolve();
        }.bind(this));
        return Promise.all(promises);
    };
    return Register;
}());

exports.Loader = Loader;
exports.JsLoader = JsLoader;
exports.CssLoader = CssLoader;
exports.ResourceLoader = ResourceLoader;
exports.ResourceUrl = ResourceUrl;
exports.Injector = Injector;
exports.HashMap = HashMap;
exports.define = define;
exports.constant = constant;
exports.Location = Location;
exports.Module = Module;
exports.Application = Application;
exports.Register = Register;

Object.defineProperty(exports, '__esModule', { value: true });

})));
