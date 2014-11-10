// hardware specific constants, DO NOT CHANGE unless you are a real pro
var BAUDRATE = 115200;
var PONG = "vlc4_mobicom";
var PING = "p";

// serial port module
var SerialMod = require("serialport");
var SerialPort = SerialMod.SerialPort;
var Promise = require('promise');

// my modules
var tools = require("./tools");
var ws = require('./websocket');

var portsInUse = [];
var mDevices = [];
module.exports = {
    // lists all vlc devices available
    list : function(callback){
        list(callback);
    },
    plist : function(callback){
        listPromised(callback);
    },
    // kill all active devices
    killall : function(callback){
        killall(callback);
    },
    // initializes a setup
    init: function (num,offers,packetSize,socket,callback) {
        killall(function(){
            setupNetwork(num,offers,packetSize,socket,callback)
        });
    },
    // initializes a setup
    setupDevice: function (socket) {
        killall(function(){
            list(function(devices){
                var device = devices[0].path;
                setupDevice(device,0,"FF",50,100,socket);
            });

        });
    }
};

var list = function(callback){
    // memoization
    if(mDevices.length==0){
        listDevices(callback);
    }else{
        callback(mDevices);
    }
}

var listDevices = function (callback) {
    SerialMod.list(function (err, ports) {
        var devices = [];
        ports.forEach(function(port) {
            console.log("Pinging: " + port.comName)
            var serialPort = new SerialPort(port.comName, {
                baudrate: BAUDRATE,
                parser: SerialMod.parsers.readline("\n")
            });
            // send ping

            serialPort.on("open", function () {

                // callback for ping
                var callback =  function (data) {
                    if (strip(data) == PONG) {
                        //console.log('got pong!');
                        // fetch address
                        sendCommand(serialPort, "a", function (data) {
                            console.log("Found device: " + data)
                            devices.push({
                                path: port.comName,
                                address: strip(data)
                            });
                            serialPort.close(function () {
                                //console.log("closed");
                            });
                        });
                    } else {
                        //console.log("Got invalid pong: '" + data + "' instead of '" + PONG + "'");
                        // either its invalid pong or address, we can close
                        serialPort.close(function () {
                            //console.log("closed");
                        });
                    }
                }

                //---- wait for the device to boot
                setTimeout(function(){
                    console.log("sending ping '" + PING + "'");
                    sendCommand(serialPort, PING,callback);
                },300);
            });
        });
        setTimeout(function(){
            mDevices = devices;
            callback(devices);
        },2000);

    });
};

var listPromised = function (callback) {
    SerialMod.list(function (err, ports) {
        var devices = [];
        ports.forEach(function(port) {
            console.log("Pinging: " + port.comName)
            var port = new SerialPort(port.comName, {
                baudrate: BAUDRATE,
                parser: SerialMod.parsers.readline("\n")
            },false);

            // ping one device
            open(port)
                .then(function(port){
                    return write(port,PING);
                })
                .then(drain)
                .then(read)
                .then(function(port,data){
                    console.log("Got " + data);
                    if (strip(data) == PONG) {
                        console.log('got pong!');
                        // fetch address
                        /*
                        sendCommand(serialPort, "a", function (data) {
                            console.log("Found device: " + data)
                            devices.push({
                                path: port.comName,
                                address: strip(data)
                            });
                            serialPort.close(function () {
                                //console.log("closed");
                            });
                        });
                        */
                    } else {
                        //console.log("Got invalid pong: '" + data + "' instead of '" + PONG + "'");
                        // either its invalid pong or address, we can close
                        /*
                        serialPort.close(function () {
                            //console.log("closed");
                        });
                        */
                    }
                })


            // send ping

            serialPort.on("open", function () {

                // callback for ping
                var callback =  function (data) {
                    if (strip(data) == PONG) {
                        //console.log('got pong!');
                        // fetch address
                        sendCommand(serialPort, "a", function (data) {
                            console.log("Found device: " + data)
                            devices.push({
                                path: port.comName,
                                address: strip(data)
                            });
                            serialPort.close(function () {
                                //console.log("closed");
                            });
                        });
                    } else {
                        //console.log("Got invalid pong: '" + data + "' instead of '" + PONG + "'");
                        // either its invalid pong or address, we can close
                        serialPort.close(function () {
                            //console.log("closed");
                        });
                    }
                }

                //---- wait for the device to boot
                setTimeout(function(){
                    console.log("sending ping '" + PING + "'");
                    sendCommand(serialPort, PING,callback);
                },300);
            });
        });
        setTimeout(function(){
            mDevices = devices;
            callback(devices);
        },2000);

    });
};

var killall = function(callback){
    portsInUse.forEach(function(port){
        port.drain(function(){
            console.log('Closing port.');
            port.close();
        })
    });
    setTimeout(function(){
        portsInUse = [];
        callback();
    },1000);
}

var pong = function(port,data){
    console.log("Got " + data);
    if (strip(data) == PONG) {
        console.log('got pong!');
        // fetch address
        return address(port);
    } else {
        //console.log("Got invalid pong: '" + data + "' instead of '" + PONG + "'");
        // either its invalid pong or address, we can close
        /*
         serialPort.close(function () {
         //console.log("closed");
         });
         */
    }
}

var address = function(port){
    return write(port,'a')
        .then(read)
        .then(function(port,data){
            var device = {
                path: port.comName,
                address: strip(data)
            };
            return Promise.from(port,device);
        })
}

var drain = function(port){
    return new Promise(function(fullfill,reject){
        port.drain(function(error){
            console.log('draining...');
            if(error){
                reject(error);
            }else{
                fullfill(port);
            }
        })
    });
}

var close = function(port){
    return new Promise(function(fullfill,reject){
        port.close(function(error){
            console.log('closing...');
            if(error){
                reject(error);
            }else{
                fullfill(port);
            }
        })
    });
}

var write = function(port,data){
    return new Promise(function(fullfill,reject){
        port.write(data,function(error){
            console.log('pushed data...');
            if(error){
                reject(error);
            }else{
                fullfill(port);
            }
        })
    });
}

var open = function(port){
    return new Promise(function(fullfill,reject){
        port.open(function(error){
            if(error){
                reject(error);
            }else{
                fullfill(port);
            }
        })
    });
}

var read = function(port){
    return new Promise(function(fulfill,reject){
        var done = false;
        port.once('data', function(data) {
            if(!done) {
                done = true;
                fulfill(port,data);
            }
        });
        // TIMEOUT
        var TIMEOUT = 1000;
        setTimeout(function(){
            if(!done){
                done=true;
                reject(new Error("Timeout on port '" + port.comName + "'"));
            }
        },TIMEOUT)
    });
}

var setupNetwork = function(num,offers,packetSize,socket,callback){
    if(num<2){
        callback(new Error("Please use at least 2 devices."));
        return;
    }

    listDevices(function(devices){
        if(devices.length<num){
            callback(new Error("Discovered to few devices, try a lower number of devices."));
            return;
        }

        // select randomly as many as we need
        devices = shuffle(devices);
        var usedDevices = devices.slice(0,num);
        var offer = Math.round(offers/(num-1));

        setupDevices(usedDevices,offer,packetSize,socket);
    });
};

var setupDevices = function(devices,offer,packetSize,socket){
    var receiver = devices[0];
    sendConfigDeferred = [];
    onOpenCounter = 0;
    devices.forEach(function(device,index){
        // The receiver
        var sending = 1,dest;
        if(index==0){
            sending=0;
            dest = "FF";
        }else{
            dest = receiver.address;
        }
        setupDevice(device.path,sending,dest,offer,packetSize,socket);
    });

    // wait a bit before sending config command
    recSendConfigs()
};

var sendConfigDeferred;
var onOpenCounter;

var recSendConfigs = function(){
    setTimeout(function() {
        if(onOpenCounter==portsInUse.length){
            sendRecDeferred();
        }else{
            recSendConfigs();
        }
    }, 1000);
}

var sendRecDeferred = function(){
    if(sendConfigDeferred.length>0){
        var fn = sendConfigDeferred.pop();
        fn();
        setTimeout(function(){
            sendRecDeferred();
        },300);
    }
}

var setupDevice = function(path, sending, dest,offer,packetSize,socket){

    var config_string = "1 "+sending+" "+dest+" "+offer+" "+packetSize+" 3 8 16 128 1\n"
    var serialPort = new SerialPort(path, {
        baudrate: BAUDRATE,
        parser: SerialMod.parsers.readline("\n")
    });
    portsInUse.push(serialPort);

    serialPort.on("open", function () {
        console.log('open');

        serialPort.on('data', function(data) {
            console.log("Received setup: "+data)
            //console.log("Expected: " + config_string)
            if(strip(config_string)==strip(data)){
                console.log("Successful setup!")
                connectDevice(serialPort,socket);
            }
        })

        sendConfigDeferred.push(function(){
            console.log('sending conf');
            serialPort.write("o");
            console.log('should now be in config mode');
            serialPort.write(config_string);
        });

        onOpenCounter++;
    });
};

var connectDevice = function(serialPort,socket){
    sendCommand(serialPort,"s",function(data){
        // stream the log-data here
        console.log(data)
        socket.write(data);
        tools.fileWrite(data+'\r\n');
    })
}

var strip = function(data){
    var str = new String(data);
    str = str.replace(/(\r\n|\n|\r)/gm,"");
    return str;
}

var sendCommand = function(dev,cmd,callback){
    dev.on('data',callback);
    dev.write(cmd);
    dev.drain();
};

function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};


/*
time.sleep(0.1)
s.write("c")
time.sleep(0.3)
config_string = "1 "+str(sending)+" "+dest+" "+config
if sending==0:
dest = port[1]
sending=1
// printf("%u %u %X %u %u %u %u %u %u %u\n",loggerVerbosity, tx, destination, offer, packetSize, retrans, difs, cwmin, cwmax, expSync);
print vt.print_port(port)+" config string: "+config_string.strip()
s.write(config_string)
config_set = s.readline().strip()
if config_set == config_string.strip():
print vt.print_port(port)+" configuration successful."
#print vt.print_port(port)+" starting..."
serial_handles.append(s)
serial_reader = SerialReader(s,port,data_queue)
serial_readers.append(serial_reader)
serial_reader.start()
counter = counter + 1
if counter==num_stations:
break
else:
print vt.print_port(port)+" bad configuration."
*/

/*
var serialPort = new SerialPort("/dev/tty0", {
    baudrate: BAUDRATE
});

serialPort.on("open", function () {
    console.log('open');
    serialPort.on('data', function(data) {
        console.log('data received: ' + data);
    });

    serialPort.write("ls\n", function(err, results) {
        console.log('err ' + err);
        console.log('results ' + results);
    });
});
*/