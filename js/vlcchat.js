#!/usr/bin/env node
// @author mohlerm

var pserial = require("./pserial");
var colors = require('colors');
var os = require('os');
var readline = require('readline');

// welcome the user
console.log('__     ___     ____    ____ _           _');
console.log('\\ \\   / / |   / ___|  / ___| |__   __ _| |_');
console.log(' \\ \\ / /| |  | |     | |   | \'_ \\ / _` | __|');
console.log('  \\ V / | |__| |___  | |___| | | | (_| | |_');
console.log('   \\_/  |_____\\____|  \\____|_| |_|\\__,_|\\__|');

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
        path = "/dev/ttyACM0"
    }
    retrans = 3;
    difs = 10;
    cwmin = 4;
    cwmax = 16;
    console.log("Using default values path=%s, retrans=3, difs=10, cwmin=4, cwmax=16".green,path);
}

pserial.connect(function(path,retrans,difs,cwmin,cwmax,callback) {
    res.json(devices);
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
    default:
      console.log('echo> '+msg);
  }
  rl.prompt();
}).on('close', function() {
  process.exit(0);
});


//console.log('Hello World');
