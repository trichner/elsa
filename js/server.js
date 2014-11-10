

var serial = require('./serial');
var ws = require('./websocket');
var rest = require('./rest');
var parser = require('./parser');

var lines = [
    "S	A	D3->C2	0	3	0	16	24129",
    "R	A	D3->C2	0	3	0	0	24208",
    "S	DR	C3->D3	100	2	0	64	23317",
    "R	DR	C3->D3	100	2	0	0	25099",
    "S	A	D3->C3	0	2	0	16	25099",
    "R	A	D3->C3	0	2	0	0	25179",
    "S	D	A1->D3	100	3	12	16	21990",
    "R	D	A1->D3	100	3	0	0	26073",
    "R	A	D3->A1	0	3	0	0	26152",
    "S	A	D3->A1	0	3	0	16	26073",
    "R	D	C3->D3	100	3	0	0	27048",
    "S	D	C3->D3	100	3	8	16	25182",
    "S	A	D3->C3	0	3	0	16	27048",
    "R	A	D3->C3	0	3	0	0	27128"
];

var apiPort = 80;

//==== FIXME ugly show-stopper stopper
process.on('uncaughtException', function (exception) {
    // handle or ignore error
});

//==== setup websocket
ws.start(8001);


//==== setup parser
var pipeline = parser.newPipeline(ws);

// DEBUG recursive sending of debug messages
var testSend = function(timeout){
    setTimeout(function() {
        pipeline.write(lines[Math.floor(Math.random() * lines.length)]);
        testSend((timeout));
    }, timeout);
}

//testSend(500);

//==== setup REST api
rest.init();

rest.add('/device',function(req,res){
    serial.list(function(devices){
        res.json(devices);
    });
});


rest.add('/setup',function(req,res){

    //query parameters
    var numberOfDevices = req.query.numberOfDevices;
    var packageSize = req.query.packageSize;
    var offers = req.query.offers;

    //validate them!
    console.log('Number of devices: ' + numberOfDevices);
    console.log('Packages: ' + packageSize + "   Offers: "+offers);

    //set defaults
    if(!numberOfDevices) numberOfDevices = 6;
    if(!packageSize) packageSize = 100;
    if(!offers) offers = 500;

    serial.init(numberOfDevices,offers,packageSize,pipeline,function(error){
        // should catch errors...
    });
    res.json({ status : "ok"});
});

rest.add('/setupSingle',function(req,res){

    //validate them!
    console.log('Setting up single device');
    serial.setupDevice(pipeline);
    res.json({ status : "ok"});
});

rest.start(apiPort)

console.log('Magic happens on port ' + apiPort);