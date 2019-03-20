## 基于模块和应用的方式构建web应用
## Get Started
```html
    <script src="webapp-core.js"></script>
```
### Module
#### Module继承[Injector](https://github.com/kouyjes/injector-ioc)，
1. 创建模块 system,system.js
```javascript
    var Module = HERE.FRAMEWORK.Module;
    Module.module('system',function(){
        this.resource = {
            js:[],//模块依赖的js
            css:[],//模块依赖的css
            langFiles:[]//模块依赖的多语文件，json格式
        };
    });
```
2. 获取模块
```javascript
    var system = Module.module('system');
```
3. 定义模块service、factory、variable、provider
```javascript
    Module.module('system').service('userService',function(){
        this.getUserInfo = function(){
            return {
                userName:'admin'
            };
        };
    });
    //获取service
    var userService = Module.module('system').getService('userService');
    var userInfo = userService.getUserInfo();
```
2. 模块依赖，search.js,模块可以依赖一个或多个模块
```javascript
    Module.module('search',function(){
        
    },'system');
    //或
    Module.module('search',function(){
            
    },['system']);
     //search service 中自动注入了system模块中定义的userService
     Module.module('search').service('searchService',['userService',function(userService){
     
        this.search = functtion(){
            
        };
     }]);
     var userService = Module.module('search').getService('userService');
     var searchService = Module.module('search').getService('');
```
### Application
#### Application继承Module
1. 创建Application
```javascript
    Application.app('user',function(){
        
    });
```
2. 获取应用
```javascript
    var user = Application.app('user');
```
3. 应用依赖，应用可以依赖应用和模块
```javascript
    //依赖search模块和user应用
    Application.app('data',function(){},'search','user');
```
### Register
#### 用来注册模块和应用
1. 注册模块，模块使用前首先需要注册模块
```javascript
    var Register = HERE.FRAMEWORK.Register.getInstance();
    //第一个参数为模块名，第二个参数为模块声明文件
    Register.registerModule('system','system/index.js');
    //或
    Register.registerModule({
        name:'system',
        url:'system/index.js'
    });
    //注册多个模块
    Register.registerModule([{
        name:'system',
        url:'system/index.js'
    },{
        name:'search',
        url:'search/index.js'
    }]);
```
2. 模块加载，模块使用前需要先加载模块，模块会加载依赖资源以及依赖模块的资源
```javascript
    Module.module('system').load().then(function(){
        
    });
```
3. 注册应用
```javascript
    Register.registerApp('user','user/index.js');
```
4. 应用加载
```javascript
    Application.app('user').load().then(function(){
            
    });
```    
