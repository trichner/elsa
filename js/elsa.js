#!/usr/bin/env node
// @author mohlerm

var pserial = require("./pserial");
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

var path, retrans, difs, cwmin, cwmax;

var argLength = args.length;
if(argLength > 1) {
    if(argLength > 1 && args[0]=='-p') {
        path = args[1];
    }
    if (argLength > 6 && args[2]=='-c') {
        retrans = args[3];
        difs = args[4];
        cwmin = args[5];
        cwmax = args[6];
        console.log("Using custom values path=%s, retrans=%s, difs=%s, cwmin=%s, cwmax=%s".green,path,retrans,difs,cwmin,cwmax);
    } else {
        console.log("Do not understand command line input; Please use: -p {PATH} -c {RETRANS} {DIFS} {CWMIN} {CWMAX} or leave empty for default".red);
        process.exit(1);
    }

} else {
// default values
    if(isWin) {
        path = "COM4";
    } else {
        path = "/dev/ttyACM1"
    }
    retrans = 3;
    difs = 10;
    cwmin = 4;
    cwmax = 16;
    console.log("Using default values path=%s, retrans=3, difs=10, cwmin=4, cwmax=16".green,path);
}
var device = pserial.getDevice(path)

device.connect()
        .then(function(){console.log("Connection successful\nchat> ".green)},function(){console.log("Connection failed\nchat> ".green)})
        .then(function(){return device.configure(retrans, difs, cwmin, cwmax)})
        .then(function(){console.log("Configuration successful\nchat> ".green)},function(){console.log("Configuration failed\nchat> ".green)})
        .then(function(){return device.enableCom()})

device.on('message', function(payload, statistics) {
    console.log('echo> '+ payload.green);
});


var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
rl.setPrompt('chat> ');
rl.prompt();

rl.on('line', function (msg) {
  switch(msg) {
    case 'quit':
      console.log('Quitting...'.green);
      rl.close();
      process.exit(0);
      break;
    case 'ping':
      console.log('echo> Pong!'.rainbow)
      break;
    case 'list':
      pserial.list(function(devices){devices.forEach(function(device){console.log((device.path + '\n').green)})})
    default:
      device.send('FF',msg);
      //console.log('echo> '+msg.green);
  }
  rl.prompt();
}).on('close', function() {
  process.exit(0);
});


//console.log('Hello World');
