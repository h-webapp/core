class Location{
    static locate(clazz,identifyName:String,url?:String){
        var $locations = clazz['$locations'];
        if(!$locations){
            $locations = {};
            Object.defineProperty(clazz,'$locations',{
                value:$locations
            })
        }
        if(url === void 0){
            return $locations[identifyName] || '';
        }
        if($locations[identifyName]){
            return;
        }
        Object.defineProperty($locations,identifyName,{
            value:url
        });
    }
}
export { Location };