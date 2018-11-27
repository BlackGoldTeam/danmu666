const crypto = require('crypto');
const Store = require('electron-store');
const store = new Store();

const Helpers = {
    getClientId: () => {
        if(store.get('clientId')){
            return store.get('clientId')
        }else{
            const id = Helpers.md5(Helpers.generateUUID());
            store.set('clientId', id);
            return id;
        }
    },
    generateUUID: function () {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }) + '.' + new Date().getTime();
    },
    md5: function(str){
        return crypto.createHash('md5').update(str).digest('hex');
    }
}

module.exports = Helpers;