// tools.js
// ========

var fs = require('fs');
var util = require('util');

var wstream = undefined;

module.exports = {
    ok: function () {
        // whatever
        return status('OK')
    },
    error: function () {
        return status('ERROR')
    },
    darg: function(arg,def){
        return (typeof arg === "undefined") ? def : arg;
    },
    fileWrite: function(data){
		/* Dummy, not working on M$ windoof
        if(wstream==undefined){
            wstream = fs.createWriteStream('log' + new Date() + '.txt');
        }
        wstream.write(data);
		*/
    }
};

var status = function(msg){
    return {
        status : msg
    };
}


