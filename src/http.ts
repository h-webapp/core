class Http{
    static getJSON(url:String):Promise{
        var resolve,reject;
        var promise = new Promise(function (_resolve, _reject) {
            resolve = _resolve;
            reject = _reject;
        });
        var xhr = new XMLHttpRequest();
        try{
            xhr.open('GET',url,true);
            xhr.onreadystatechange = function () {
                if(xhr.readyState !== 4){
                    return;
                }
                var status = xhr.status;
                var isSuccess = status >= 200 && status < 300 || status === 304;
                if(isSuccess){
                    try{
                        resolve(JSON.parse(xhr.responseText));
                    }catch(e){
                        reject(e);
                    }
                }else{
                    reject(xhr);
                }
            }
            xhr.send();
        }catch(e){
            console.error(e);
            reject && reject(xhr);
        }

        return promise;
    }
}
export { Http };