// hardware specific constants, DO NOT CHANGE unless you are a real pro
var BAUDRATE = 115200;
var PONG = 'vlc4_mobicomp';
var CMD_PING = 'p';
var CMD_ADDRESS = 'a';
var CMD_CONFIG = 'c';

var EVENT_RECEIVED = '1';
var EVENT_SENDING = '2';
var EVENT_SENT = '3';

var BOOTDELAY = 2000;

// serial port module
var SerialMod = require("serialport");
var SerialPort = SerialMod.SerialPort;
var Promise = require('promise');

// my modules
var tools = require("./tools");
var ws = require('./websocket');

var mySocket = undefined;

module.exports = {
    // lists all vlc devices available
    list : function(callback){
        marcoPolo(callback);
    },
    // lists all vlc devices available
    connect : function(path,retrans,difs,cwmin,cwmax,callback){
        return connect(path,retrans,difs,cwmin,cwmax,callback)
    },
    disconnect : function(){
        return disconnect()
    },
    send : function(data){
        //UNBUFFERED!
        if(mySocket){
            return write(mySocket,data);
        }
    },
    onMessage : function(callback){
        if(mySocket){
            return onMessage(mySocket,callback);
        }
    }
};

var connect = function(path,retrans,difs,cwmin,cwmax,callback){
    if(mySocket){
        var e = new Error("Still connected to " + mySocket.path);
        if(callback)  callback(e);
        return Promise.reject(e);
    }
    var socket = initSocket(path);

    var retString = makeConfig(retrans,difs,cwmin,cwmax);
    var configCmd = CMD_CONFIG + makeConfig(retrans,difs,cwmin,cwmax)+ '\0';
    return open(socket)
        .then(elisten)
        .then(function (socket) {
            return wait(socket, BOOTDELAY);
        })
        .then(function(socket){
            return write(socket,configCmd)
        })
        .then(drain)
        //
        .then(read)
        .then(function(arr){
            var socket = arr[0];
            var json = arr[1];
            if(json.d==retString){
                console.log("config set up")
            }
            return socket;
        })
        .then(function(socket){
            mySocket = socket;
            callback();
        })
}

var makeConfig = function(retrans,difs,cwmin,cwmax){
    return retrans + ' ' + difs + ' ' + cwmin +' ' + cwmax ;
}

var disconnect = function(){
    if(mySocket){
        close(mySocket);
    }
}

//==== Device Discovery
var marcoPolo = function (callback) {
    SerialMod.list(function (err, ports) {
        var devices = [];
        var promises = [];
        ports.forEach(function (port) {
            promises.push(probePort(port,devices))
        });

        var discoveryDone = function(){
            console.log("Discovery done.")
            callback(devices);
        }

        Promise.all(promises)
            .then(discoveryDone,discoveryDone);
    });
};

var probePort = function(port,devices){
    console.log("probing: " + port.comName)

    var socket = initSocket(port.comName);

    // ping one device
    return open(socket)
        .then(elisten)
        .then(function (socket) {
            return wait(socket, BOOTDELAY);
        })
        // ping possible device
        .then(ping)
        // got ping, check address
        .then(address,close)
        // ok, get address
        .then(function(arr){
            var socket = arr[0];
            var device = arr[1];
            devices.push(device);
            return Promise.resolve(socket);
        },close)
        .then(function (socket) {
            return wait(socket, 100);
        })
        .then(close,close);
}

//==== Promised Methods

var ping = function(port){
    return cmd(port,CMD_PING)
        .then(function(arr){
            var port = arr[0];
            var json = arr[1];
            return new Promise(function(fullfill,reject){
                if (strip(json.d) == PONG) {
                    fullfill(port)
                } else {
                    reject([port,new Error("Device not found!")])
                }
            })
        });
}

var cmd = function(port,cmd){
    return write(port,cmd)
        .then(drain)
        .then(read);
}

var address = function(port){
    return cmd(port,CMD_ADDRESS)
        .then(function(arr){
            var port = arr[0];
            var json = arr[1];
            //console.log("Arr: %j", arr);
            var device = {
                path: port.path,
                address: strip(json.d)
            };
            return Promise.resolve([port,device]);
        },Promise.reject(port))
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
        console.log('closing ' + port.comName +'...');
        port.close(function(error){
            console.log('closed.');
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
        console.log("writing: '" + data + "'")
        if(!Buffer.isBuffer(data)){
            data = new Buffer(data,'utf8')
        }

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
                console.log("opened...")
                fullfill(port);
            }
        })
    });
}

var read = function(port){
    return new Promise(function(fulfill,reject){
        var done = false;
        port.once('data', function(data) {
            console.log("Got: " + data)
            console.log("Type: " + typeof data)
            if(!done) {
                done = true;
                fulfill([port,JSON.parse(data)]);
            }
        });
        // TIMEOUT
        var TIMEOUT = 1000;
        setTimeout(function(){
            if(!done){
                console.log("read timeout :(")
                done=true;
                reject(new Error("Timeout on port '" + port.comName + "'"));
            }
        },TIMEOUT)
    });
}

var listen = function(port,callback){
    return new Promise(function(fulfill,reject){
        console.log("listening...")
        port.on('data', function(data) {
            console.log("Got: " + data)
            callback(JSON.parse(data));
        });
        fulfill(port);
    });
}

var elisten = function(port){
    return new Promise(function(fulfill,reject){
        console.log("listening for errors...")
        port.on('error', function(data) {
            console.log("oh noes! a serial error!")
            port.close(function(error){

            })
        });
        fulfill(port);
    });
}

var wait = function(port,time){
    return new Promise(function(fulfill,reject){
        console.log("waiting " + time + "ms...")
        setTimeout(function(){
            fulfill(port);
        },time);
    });
}

var onMessage = function(socket,callback){
    return listen(socket,function(json){
        if(json.c==EVENT_RECEIVED){
            callback(json.d)
        }
    });
}

//==== HELPERS
var strip = function(data){
    var str = new String(data);
    str = str.replace(/(\r\n|\n|\r)/gm,"");
    return str;
}

var initSocket = function(path){
    return new SerialPort(path, {
        baudrate: BAUDRATE,
        parser: SerialMod.parsers.readline('\0', 'utf8')
    }, false);
}


var receive = function(callback){
    return function(arr){
        var socket = arr[0];
        var json = arr[1];
        return callback(socket,json);
    }
}


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