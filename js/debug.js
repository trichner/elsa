

var pserial = require('./pserial');


//==== FIXME ugly show-stopper stopper
process.on('uncaughtException', function (exception) {
    // handle or ignore error
    console.log("PANIC: " + exception);
});

pserial.list()
    .then(function(devices){
        devices.forEach(function(device){
            console.log("Device: " + device.path);
        })
    })
    .then(function(){
        console.log("instantiating device...")
        var device = pserial.getDevice("COM4");
        console.log("got device...")
        device.on('sending',function(payload,statistics){
            console.log("Stats: " + statistics);
            console.log("Data:  " + payload);
        });
        console.log("connecting...")
        return device.connect();
    })
    .then(function(device){
        console.log("configuring...")
        console.log("got device: " + JSON.stringify(device))
        return device.configure(3,10,4,16);
    }).done(function(){
        console.log("all systems nominal")
    })






