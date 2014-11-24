var pserial = require('./pserial');

//==== FIXME ugly show-stopper stopper
process.on('uncaughtException', function (exception) {
    // handle or ignore error
    console.log("PANIC: " + exception);
});

var path = "/dev/ttyACM0"

var mDevice = pserial.getDevice(path)

mDevice.connect()
    .then(function(device){
        device.on('sending',function(payload,statistics){
            console.log("Stats: " + statistics);
            console.log("Data:  " + payload);
        });
    })
    .then(function(device){
        console.log("configuring...")
        return device.configure(3,10,4,16);
    })
    .then(function(device){
        console.log("enable com...")
        return device.enableCom();
    })
    .then(function(device){
        return device.send('FF',"Hello World")
    })
    .done(function(){
        console.log("all systems nominal")
    })






