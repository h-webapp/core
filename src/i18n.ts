import { constant } from './define';

(function initLnaguage(){
    if(typeof navigator === 'undefined'){
        console.warn('navigator language init fail !');
        return;
    }
    var language = navigator.language || navigator['browserLanguage'] || navigator['userLanguage'] || 'zh-cn';
    language = language.toLowerCase();
    constant('language',language);
})();
function getLanguage(){
    return constant('language');
}
export { getLanguage }