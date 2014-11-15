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
        device.on('sending',function(payload,statistics){
            console.log("Stats: " + statistics);
            console.log("Data:  " + payload);
        });
        console.log("connecting...")
        return device.connect();
    })
    .then(function(device){
        console.log("configuring...")
        return device.configure(3,10,4,16);
    })
    .then(function(device){
        return device.send(['F','F'],"Hello World")
    })
    .done(function(){
        console.log("all systems nominal")
    })






