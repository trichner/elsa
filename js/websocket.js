/**
 * Created by trichner on 10.10.14.
 */
var ws = require("nodejs-websocket");
var server;
module.exports = {
    start: function (port) {
        server = ws.createServer(function (connection) {
            // start websocket server on specified port
            console.log("New connection");

            console.log("WS Path: " +connection.path);
            connection.on("close", function (code, reason) {
                console.log("Connection closed. Reason: '" + reason+"' Code: '" + code + "'")
            });
            connection.on("error", function (err) {
                console.log("Connection error")
            });
        }).listen(port);
    },

    write : function(obj){
        if(!server) return;

        // serialize the object and broadcast it
        var json = JSON.stringify(obj);
        server.connections.forEach(function (connection) {
            try {
                connection.sendText(json);
            }catch (err){
                // do nothing, not our problem
            }
        });
    }
};



// Scream server example: "hi" -> "HI!!!"
