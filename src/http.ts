class Http{
    static getJSON(url:String):Promise{
        var resolve,reject;
        var promise = new Promise(function (_resolve, _reject) {
            resolve = _resolve;
            reject = _reject;
        });
        var xhr = new XMLHttpRequest();
        xhr.open('GET',url,true);
        xhr.onreadystatechange = function () {
            var status = xhr.status;
            var isSuccess = status >= 200 && status < 300 || status === 304;
            if(isSuccess){
                try{
                    resolve(JSON.parse(xhr.responseText));
                }catch(e){
                    reject(e);
                }
            }
        }
        return promise;
    }
}
export { Http };