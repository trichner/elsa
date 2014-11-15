var tools = require('./tools');

/*
 S	A	D3->C2	0	3	0	16	24129
 R	A	D3->C2	0	3	0	0	24208
 S	DR	C3->D3	100	2	0	64	23317
 R	DR	C3->D3	100	2	0	0	25099
 S	A	D3->C3	0	2	0	16	25099
 R	A	D3->C3	0	2	0	0	25179
 S	D	A1->D3	100	3	12	16	21990
 R	D	A1->D3	100	3	0	0	26073
 R	A	D3->A1	0	3	0	0	26152
 S	A	D3->A1	0	3	0	16	26073
 R	D	C3->D3	100	3	0	0	27048
 S	D	C3->D3	100	3	8	16	25182
 S	A	D3->C3	0	3	0	16	27048
 R	A	D3->C3	0	3	0	0	27128
*/
var WINDOW_SIZE_MS = 10000;

module.exports = {
    // lists all vlc devices available
    testPipeline : function(){
        return new LogParser(new Decorator(new ConsoleSocket()));
    },
    newPipeline : function(socket){
        return new LogParser(new StatPipe(new Decorator(socket),WINDOW_SIZE_MS));
    },
    csvPipeline : function(stream){
        return new LogParser(new CsvStreamSocket(stream));
    },
    delayPipeline : function(stream){
        return new LogParser(new DelayLog(stream));
    },
    logPipeline : function(csv,delay){
        return new LogParser(new Tee([new CsvStreamSocket(csv),new DelayLog(delay)]));
    }
    // initializes a setup
};

var MsgType = {
    SEND : "SEND",
    RECEIVE : "RECEIVE"
};

var PkgType = {
    DATA : "DATA",
    DATA_RETRY : "DATA_RETRY",
    ACK : "ACK"
};

//---- helpers
function nop(){}
function doCall(callback,arg){
    callback = tools.darg(callback,nop);
    callback(arg);
}

//==== parse Log file into useful objects
// parses log-lines into objects
function LogParser (decorator) {
    this.decorator = decorator;
};

// parse and pass on
LogParser.prototype.write = function (line,done) { // step 3
    var msg = this.parseLine(line)
    if(msg===undefined){
        doCall(done,new Error("Unable to parse line."));
    }else{
        this.decorator.write(msg);
        doCall(done);
    }
}

// parse lines, ignore if not parseable
LogParser.prototype.parseLine = function(line){
    // example line:
    // send/receive  | packet type | src->dst | data size | ? | backoff | cw  | timestamp (offset)
    // R                A            D3->C3         0       3       0       0   27128
    if(!line){
        return undefined;
    }
    var splits = line.split(',');
    if(splits.length!=8){
        return undefined;
    }
    //---- parse send/receive
    var stype = splits[0];
    var type;
    if(stype=='S'){
        type = MsgType.SEND;
    }else if(stype=='R'){
        type = MsgType.RECEIVE;
    }else{
        return undefined;
    }
    //---- parse packet type
    var sptype = splits[1];
    var ptype;
    if(sptype=='A'){
        ptype = PkgType.ACK;
    }else if(sptype=='D'){
        ptype = PkgType.DATA;
    }else if(sptype=='DR'){
        ptype = PkgType.DATA_RETRY;
    }else{
        return undefined;
    }
    //---- parse src/dst
    var saddr = splits[2];
    var ssplits = saddr.split('->');
    if(ssplits.length!=2){
        return undefined;
    }
    var src=ssplits[0],dst=ssplits[1];
    //---- parse data size
    var sdata = splits[3];
    var data_size = parseInt(sdata);
    if(data_size==NaN){
        return undefined;
    }

    //---- parse moar

    // omit for now, we do not need it (YAGNI)

    //---- parse timestamp
    var stimestamp = splits.pop();
    var timestamp = parseInt(stimestamp);
    if(timestamp==NaN){
        return undefined;
    }
    // Yay! all is parsed, return object!
    var message = {
        sender: src,
        receiver: dst,
        type: type, // or Receive
        packet_type: ptype, // or ACK or DR?
        data_size: data_size,
        timestamp: timestamp
    };
    return message;
}

//==== Decorate messages with package count
// adds statistics for the sender to the message
function Decorator(socket){
    this.socket = socket;
    this.aggregate = {};
    this.packageCount = 0;
}

Decorator.prototype.write = function(message,done){
    // aggregate the message
    this.aggregateMessage(message);

    // decorate it
    this.decorateMessage(message);

    // aaand ship it to the next layer
    this.socket.write(message);

    // execute callback, we had no errors (hopefully)
    doCall(done);
}

Decorator.prototype.aggregateMessage = function(message){
    // sender specific
    if(!(message.sender in this.aggregate)){
        this.aggregate[message.sender] = {transmitted:0,successful:0,retries:0};
    }
    //(any) package transmitted?
    if(message.type == MsgType.SEND){
        this.packageCount++;
        if(message.packet_type == PkgType.DATA_RETRY){
            this.aggregate[message.sender].transmitted++;
            this.aggregate[message.sender].retries++;
        }else if(message.packet_type == PkgType.DATA){
            this.aggregate[message.sender].transmitted++;
        }
    }else if(message.type == MsgType.RECEIVE && message.packet_type== PkgType.ACK){
        this.aggregate[message.receiver].successful++;
    }else{
        // we dont care
    }
}

Decorator.prototype.decorateMessage = function(message){
    // decorate the message
    message.transmitted     = this.aggregate[message.sender].transmitted;
    message.successful      = this.aggregate[message.sender].successful;
    message.retries         = this.aggregate[message.sender].retries;
    message.packageCount    = this.packageCount;
}


//==== socket that only writes to console, testing purposes
function ConsoleSocket(){}

ConsoleSocket.prototype.write = function(message){
    console.log("==== new message:");
    console.log(message);
}

//==== socket that only writes to file
function CsvStreamSocket(stream){
    this.stream = stream;
}

CsvStreamSocket.prototype.write = function(message){
    // Yay! all is parsed, return object!

    var line = "" + message.timestamp;
    line = csvAppend(line,message.type);
    line = csvAppend(line,message.packet_type);
    line = csvAppend(line,message.sender);
    line = csvAppend(line,message.receiver);
    line = csvAppend(line,message.data_size);
    this.stream.write(line + '\n');
}

function csvAppend(line,str) {
    return line + ',' + str;
}

//==== socket that only writes to file
function DelayLog(stream){
    this.stream = stream;
    this.lastData = undefined;
}

DelayLog.prototype.write = function(message){
    if(message.type==MsgType.SEND && message.packet_type==PkgType.DATA){
        this.lastData = message;
    }else{
        if(this.lastData && message.packet_type==PkgType.ACK){
            var line = message.timestamp - this.lastData.timestamp;
            line = csvAppend(line,this.lastData.data_size);
            this.stream.write(line + '\n');
        }
    }
}

//==== add throughput statistics to message
// keeps a window of the last few messages to calculate the throughput
// windowSize is in ms
function StatPipe (socket,windowSize) {
    this.socket = socket;
    this.slidingWindow = [];
    this.windowSize = windowSize;
    this.throughput = 0;
};

//==== statistics pipe
StatPipe.prototype.write = function (msg,done) { // step 3
    var now = msg.timestamp;

    if (msg.type == 'RECEIVE') {
        this.slidingWindow.push(msg);
    }

    //---- update window
    while (this.slidingWindow.length > 0) {
        var first = this.slidingWindow[0];
        // update our window
        if ((now - first.timestamp) > this.windowSize) {
            this.slidingWindow.shift();
        } else {
            break;
        }
    }

    //---- calculate throughput
    var allBytes = 0;
    this.slidingWindow.forEach(function(item){
       allBytes+=item.data_size;
    });
    this.throughput = allBytes/this.windowSize;

    //---- decorate message
    msg.throughput = this.throughput;

    //---- write it to next layer
    this.socket.write(msg);
}


//==== Filter
function Filter(socket,predicate){
    this.socket = socket;
    this.predicate = predicate;
}

Filter.prototype.write = function(message){
    if(this.predicate(message)){
        this.socket.write(message);
    }
}

//==== Tee
// write to several sockets
function Tee(sockets){
    this.sockets = sockets;
}

Tee.prototype.write = function(message){
    this.sockets.forEach(function(s){
        s.write(message);
    });
}

//==== Callback
// execute callback
function CallMe(callback){
    this.callback = callback;
}

CallMe.prototype.write = function(message){
    this.callback(message);
}