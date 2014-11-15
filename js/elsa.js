#!/usr/bin/env node
// @author mohlerm

var pserial = require("./pserial");
var parser = require('./parser');
var fs = require('fs');
var colors = require('colors');
var os = require('os');
var readline = require('readline');

// welcome the user
console.log('      _');
console.log('  ___| |___  __ _');
console.log(' / _ \\ / __|/ _` |');
console.log('|  __/ \\__ \\ (_| |');
console.log(' \\___|_|___/\\__,_| VLC Chat');

// check for windows
var isWin = (os.platform() === 'win32' || os.platform() === 'win64');
var args = process.argv.slice(2);

var path, retrans, difs, cwmin, cwmax, log;

var argLength = args.length;
var errorFlag = false;

// SET DEFAULT VALUES
if (isWin) {
    path = "COM4";
} else {
    path = "/dev/ttyACM0"
}
log = "";
retrans = 3;
difs = 10;
cwmin = 4;
cwmax = 16;


if (argLength > 0) {
    var paramMap = {};
    var arg;
    var option;
    while(arg = args.shift()) {
        if(arg[0] == '-') {
            option = arg[1];
            paramMap[option] = [];
        } else {
            if(!option) {
                errorFlag = true;
                break;
            } else {
                paramMap[option].push(arg)
            }
        }
    }
    if(paramMap.hasOwnProperty('p')) {
        if(paramMap.p && paramMap.p.length == 1) {
            path = paramMap.p[0];
            console.log("Using custom path=%s".green, path);
        } else {
            errorFlag = true;
        }
    } else {
        console.log("Using default path=%s".green, path);
    }
    if(paramMap.hasOwnProperty('l')) {
        if(paramMap.l && paramMap.l.length == 1) {
            log = paramMap.l[0];
            console.log("Logging to files: %s_log.csv and %s_delay.csv".green, log, log);
        } else {
            errorFlag = true;
        }
    } else {
        console.log("Logging disabled".green);
    }
    if(paramMap.hasOwnProperty('c')) {
        if(paramMap.c && paramMap.c.length == 4) {
            retrans = paramMap.c[0];
            difs = paramMap.c[1];
            cwmin = paramMap.c[2];
            cwmax = paramMap.c[3];
            console.log("Using custom values retrans=%s, difs=%s, cwmin=%s, cwmax=%s".green, retrans, difs, cwmin, cwmax);
        }
    } else {
        console.log("Using default values, retrans=%s, difs=%s, cwmin=%s, cwmax=%s".green, retrans, difs, cwmin, cwmax);
    }

    if(errorFlag) {
        console.log("Do not understand command line input; Please use: -p {PATH} -l {LOGFILE} -c {RETRANS} {DIFS} {CWMIN} {CWMAX} or leave empty for default".red);
        process.exit(1);
    }


} else {
    console.log("Using default values path=%s, retrans=%s, difs=%s, cwmin=%s, cwmax=%s and logging disabled".green, path, retrans, difs, cwmin, cwmax);
}
var device = pserial.getDevice(path)

device.connect()
    .then(function () {
        console.log("Connection successful\nchat> ".green)
    }, function () {
        console.log("Connection failed\nchat> ".green)
    })
    .then(function () {
        return device.configure(retrans, difs, cwmin, cwmax)
    })
    .then(function () {
        console.log("Configuration successful\nchat> ".green)
    }, function () {
        console.log("Configuration failed\nchat> ".green)
    })
    //.then(function () { // it seems we don't need it since 'e' is default
    //    return device.enableCom()
    //})

if(log != "") {
    var csv = fs.createWriteStream(log+"_log.csv");
    var delay = fs.createWriteStream(log+"_delay.csv");
    var pipe = parser.logPipeline(csv, delay);
}

device.on('message', function (payload, statistics) {
    console.log('echo> ' + payload.green);
    if(log != "") {
        pipe.write(statistics)
    }
});
device.on("sent", function (payload, statistics) {
    if(log != "") {
        pipe.write(statistics)
    }
})
device.on("sending", function (payload, statistics) {
    if(log != "") {
        pipe.write(statistics)
    }
})


var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.setPrompt('chat> '.green);
rl.prompt();

rl.on('line', function (msg) {
    var arg = msg.split(' ')
    switch (arg[0]) {
        case '/quit':
            console.log('Quitting...'.green);
            rl.close();
            device.close();
            process.exit(0);
            break;
        case '/ping':
            console.log('echo> Pong!'.rainbow)
            break;
        case '/list':
            pserial.list(function (devices) {
                devices.forEach(function (device) {
                    console.log((device.path + '\n').green)
                })
            })
            break;
        case '/spam':
            if(arg.length == 3) {
                console.log('generating traffic...'.red)
                trafficGen(arg[1],arg[2])
            } else {
                console.log('Please specify an address and packet size in bytes, e.g /spam AB 16'.red)
            }
            break;
        default:
            if(isPrivateMessage(msg)) {
                device.send(msg.slice(1,3),msg.slice(4))
            } else {
                device.send('FF', msg);
            }
        //console.log('echo> '+msg.green);
    }
    rl.prompt();
}).on('close', function () {
    device.close();
    process.exit(0);
});


function isPrivateMessage(msg) {
    return hasPrefix(msg,'@') && isValidAddress(msg.slice(1,3))
}

function isValidAddress(addr) {
    return addr.length == 2 // TODO: add check for valid hex number
}

function hasMessagePrefix(msg) {
    return hasPrefix(msg,'@');
}
function hasPrefix(msg,char) {
    return msg.length > 0 && msg[0] == char;
}

function trafficGen(address, packetSize) {
    device.send(address, messageGen(packetSize))
    device.on("sent", function (payload, statistics) {
        device.send(address, messageGen(packetSize))
    })
}

function messageGen(packetSize) {
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXZabcdefghijklmnopqrstuvwxyz1234567890"
    var text = ""
    for(var i=0 ; i < packetSize ; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}