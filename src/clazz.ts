class Class{
    assign(fields:String[],option,machType:boolean = true){
        if(!option){
            return;
        }
        fields.forEach((field) => {
            if(option[field] === void 0){
                return;
            }
            if(!machType || typeof this[field] === option[field]){
                this[field] = option[field];
            }
        });
    }
}
export { Class };