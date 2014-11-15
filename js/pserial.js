// VLC Constants
var BAUDRATE = 115200;

var CMD_PING = 'p';
var CMD_ADDRESS = 'a';
var CMD_CONFIG = 'c';
var CMD_SEND = 'm';
var CMD_RESET = 'r';
var CMD_DCOM = 'd';
var CMD_ECOM = 'e';

var EVENT_RECEIVED = '1';
var EVENT_SENDING = '2';
var EVENT_SENT = '3';

var PONG = 'vlc4_mobicomp';
var MAX_PKG_SIZE = 200;
var BOOTDELAY = 2000;

// serial port module
var SerialMod = require("serialport");
var events    = require('events');
var Promise   = require('promise');

// my modules
var tools     = require("./tools");


var SerialPort = SerialMod.SerialPort;

var mySocket = undefined;

module.exports = {
    // lists all vlc devices available
    list : function(callback){
        return marcoPolo(callback);
    },
    getDevice : function(path){
        return new VLCDevice(path);
    }
};

//==== ral OO
function VLCDevice (path) {
    this.socket;
    this.path = path;
    this.emitter = new (events.EventEmitter)();
    this.chunker = new ChunkedBuffer();
    this.state = State.IDLE;
};

// open port
VLCDevice.prototype.connect = function () { // step 3
    this.emitter = new (events.EventEmitter)();
    this.socket = initSocket(this.path);
    var self = this;
    return open(this.socket)
        // listen for errors, wait for boot
        .then(elisten)
        .then(function(socket){return wait(socket,BOOTDELAY)})
        // write more buffered data if device ready
        // register emitters
        .then(function(socket){
            self.on('sent',function(){
                self._write();
            })
            return emit(socket,self.emitter)
        })
        .then(function(){return self});
}

// close port
VLCDevice.prototype.close = function () { // step 3
    var self = this;
    return close(this.socket).then(function(){return self});;
}

// events
VLCDevice.prototype.on = function (event,callback) { // step 3
    console.log("registering callback")
    this.emitter.on(event,callback);
}

// write a message
VLCDevice.prototype.send = function (dest,data) { // step 3
    // use a stream
    var buf = makeMessage(dest,data);
    this.chunker.push(buf);
    var prom = this;
    if(this.state==State.IDLE){
        prom = this._write()
    }
    return prom;
}

// write message
VLCDevice.prototype._write = function () { // step 3
    console.log('_writing...')
    var prom;
    var self = this;
    if(this.chunker.ready()){
        this.state = State.BUSY;
        var buf = this.chunker.read();
        prom = write(this.socket,buf)
            .then(function(){return self});
    }else{
        this.state = State.IDLE;
        prom = self;
    }
    return prom;
}

// ping the device
VLCDevice.prototype.ping = function () { // step 3
    // use a stream
    var self = this;
    return ping(this.socket)
        .then(function(){
            return true;
        },
        function(){
            return self;
        })
}

// fetch the address
// ping the device
VLCDevice.prototype.address = function () { // step 3
    // use a stream
    var self = this;
    return cmd(this.socket,CMD_ADDRESS)
        .then(function(arr){
            var json = arr[1];
            return [self, strip(json.d)];
        });
}

// reset the device
// TODO not sure if this can work, does it close the serialport?
VLCDevice.prototype.reset = function () { // step 3
    // use a stream
    var self = this;
    return write(this.socket,CMD_RESET)
        .then(function(){
            return wait(undefined,BOOTDELAY);
        })
        .then(function(){return self});
}

// enables communication
VLCDevice.prototype.enableCom = function () { // step 3
    // use a stream
    var self = this;
    return cmd(this.socket,CMD_ECOM)
        .then(function(arr){
            return arr[0];
        })
        .then(function(){return self});
}

// disables communication
VLCDevice.prototype.disableCom = function () { // step 3
    // use a stream
    var self = this;
    return cmd(this.socket,CMD_DCOM)
        .then(function(arr){
            return arr[0];
        })
        .then(function(){return self});
}

VLCDevice.prototype.configure = function(retrans,difs,cwmin,cwmax) { // step 3
    console.log("configuring...")
    var self = this;
    var retString = makeConfig(retrans,difs,cwmin,cwmax);
    var configCmd = CMD_CONFIG + makeConfig(retrans,difs,cwmin,cwmax)+ '\0';
    return write(this.socket,configCmd)
        .then(read)
        .then(function(arr){
            return new Promise(function(fulfill,reject){
                var json = arr[1];
                if(json.d==retString){
                    console.log("config set up")
                    fulfill();
                }else{
                    reject(new Error("Cannot configure device."));
                }
            });
        })
        .then(function(){return self});
}

//==== Chunking

var State = {
    IDLE : "IDLE",
    BUSY : "BUSY"
};

function ChunkedBuffer () {
    this.buffers = [];
};

// disables communication
ChunkedBuffer.prototype.push = function (data) { // step 3
    var buf;
    if(!Buffer.isBuffer(data)){
        buf = new Buffer(data);
    }else{
        buf = data;
    }

    while(buf.length>MAX_PKG_SIZE){
        this.buffers.push(buf.slice(0,MAX_PKG_SIZE));
        buf = buf.slice(MAX_PKG_SIZE);
    }
    this.buffers.push(buf.slice(0));
}

// disables communication
ChunkedBuffer.prototype.read = function () { // step 3
    var ret;
    if(this.buffers.length==0){
        ret = new Buffer();
    }else{
        ret = this.buffers.shift();
    }
    return ret;
}

// disables communication
ChunkedBuffer.prototype.ready = function () { // step 3
    return this.buffers.length>0
}



//-------

var makeMessage = function(dest,data){
    var baddr = 0xFF & hexStrToInt(dest);
    var dlen = data.length + 3;
    var buf = new Buffer(dlen);

    buf.write(CMD_SEND,0);
    buf.writeUInt8(baddr,1);
    buf.write(data,2)
    buf.write('\0',dlen-1)
    console.log("Buffer: " + buf)
    return buf;
}

var hexStrToInt = function(str) {
    var result = 0;
    str = str.toLowerCase();
    str = str.split('');
    while (str.length > 0) {
        result <<=4;
        var nibble;
        switch(str.shift()){
            case '0': nibble = 0; break;
            case '1': nibble = 1; break;
            case '2': nibble = 2; break;
            case '3': nibble = 3; break;
            case '4': nibble = 4; break;
            case '5': nibble = 5; break;
            case '6': nibble = 6; break;
            case '7': nibble = 7; break;
            case '8': nibble = 8; break;
            case '9': nibble = 9; break;
            case 'a': nibble = 10; break;
            case 'b': nibble = 11; break;
            case 'c': nibble = 12; break;
            case 'd': nibble = 13; break;
            case 'e': nibble = 14; break;
            case 'f': nibble = 15; break;
            default:
                continue;
        }
        result += nibble;
    }

    return result;
}

// registers an emitter to the given socket
var emit = function(socket,emitter){
    console.log("registering emitter...")
    var router = {};
    router[EVENT_RECEIVED] = function(payload,statistics){
        emitter.emit('message',payload,statistics);
    };

    router[EVENT_SENDING] = function(payload,statistics){
        emitter.emit('sending',payload,statistics);
    };

    router[EVENT_SENT] = function(payload,statistics){
        emitter.emit('sent',payload,statistics);
    };

    return listen(socket,function(json){
        if(router[json.c]){
            router[json.c](json.d,json.s);
        }
    });
}



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
    return new Promise(function(fulfill,reject){
        SerialMod.list(function (err, ports) {
            var devices = [];
            var promises = [];
            ports.forEach(function (port) {
                promises.push(probePort(port,devices))
            });

            var discoveryDone = function(){
                console.log("Discovery done.")
                if(callback) callback(devices);
                fulfill(devices);
            }

            // don't care if some failed
            Promise.all(promises)
                .then(discoveryDone,discoveryDone);
        });
    });
};

var probePort = function(port,devices){
    console.log("probing " + port.comName + "...")

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
            console.log('Received: ' + data)
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