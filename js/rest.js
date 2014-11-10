var express    = require('express'); 		// call express
var connect = require('connect')
var serveStatic = require('serve-static')
var bodyParser = require('body-parser');
var tools = require('./tools');

var app        = express(); 				// define our app using express

var router = undefined;
module.exports = {
    init: function () {
        init();
    },
    add: function (path,callback) {
        add(path,callback);
    },
    start: function(port){
        // REGISTER OUR ROUTES -------------------------------
        // all of our routes will be prefixed with /api
        app.use('/api', router);
        app.use(serveStatic('../web-ui', {'index': ['raphael.html']}))
        // START THE SERVER
        app.listen(port);
    }
};

var add = function(path,callback){
    router.route(path).get(callback);
}

var init = function(){
    // configure app to use bodyParser()
    // this will let us get the data from a POST
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    // ROUTES FOR OUR API
    // =============================================================================
    router = express.Router(); 				// get an instance of the express Router
    add('/',function(req,res){
        req.json = tools.ok()
    });
}




