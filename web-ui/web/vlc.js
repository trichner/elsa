var vlcApp = angular.module('vlc', ['luegg.directives']);

vlcApp.controller('vlc-controller', function ($scope,$http) {
    $scope.scrolltext = "";

    $scope.numberOfDevices = "";
    $scope.packageSize = "";
    $scope.offers = "";

    $scope.onSetup = function(){
        $http({
            url: "/api/setup",
            method: "GET",
            params: {'numberOfDevices': $scope.numberOfDevices,
                     'packageSize' : $scope.packageSize,
                     'offers':$scope.offers
                    }
            }).
            success(function(data){
                //alert('Setup done!')
            });
    }

    //==== fetch this from API
    // !Hardcoded! FIXME

    var devices = [{path:"/dev/ttyACM8",address:"C2"},{path:"/dev/ttyACM9",address:"D3"},{path:"/dev/ttyACM3",address:"A1"},{path:"/dev/ttyACM4",address:"A2"},{path:"/dev/ttyACM6",address:"C1"},{path:"/dev/ttyACM5",address:"D1"},{path:"/dev/ttyACM10",address:"B3"},{path:"/dev/ttyACM7",address:"C3"}];

    $http.get('/api/device').
        success(function(data){
            console.log("Devices data: " + data);
            devices = data;

            //==== set up canvas
            setupCanvas();

            //==== setup pipelines & websockets
            setupPipelines();

        });

    /* message = {
        sender: 'C2',
        receiver: 'A1',
        type: 'SEND', // or Receive
        packet_type: 'DATA', // or ACK or DR?
        timestamp: 32049
    } */



    /*
     * Filter is essentially a poor-man's-router
     *   ___________    _____     ______________
     * -| Websocket|---| Tee|----| CallMe (log)|
     *  '----------'   '---'     '------------'
     *                    |    _____________     _____
     *                    '---| Deserializer|---| Tee|
     *                        '------------'    '---'   _____________
     *                                             |---| CallMe (txt)|
     *                                             |   '------------'
     *                                             |    __________   ___________
     *                                             |---| Filter1 |--| Callback1|
     *                                             |   '--------'   '---------'
     *                                             |   ...
     */



    //==== private methods

    function setupPipelines(){
        var logPipe = new CallMe(function(str){appendScrollLine(str)});

        var filterPipes = [];
        filterPipes.push(ackPipe());
        filterPipes.push(retryPipe());
        filterPipes.push(dataPipe());

        // callback to update the counters
        filterPipes.push(statPipe());

        var deserializer = new Deserializer(new Tee(filterPipes));
        var pipes = new Tee([logPipe,deserializer]);

        connectWebSocket('ws://' + window.location.hostname + ':8001',function (e) {
            pipes.write(e.data,function(err){
                // callback, do nothing so far...
            });
        });
    }

    function statPipe(){
        return new CallMe(function(msg){
            drawer.updateCount('Total sent packages: ' + msg.packageCount + ' @ ' + (msg.throughput*1000) + 'B/s' );
            drawer.updateText(msg.sender,0,msg.transmitted);
            drawer.updateText(msg.sender,1,msg.successful);
            drawer.updateText(msg.sender,2,msg.retries);
        })
    }

    function ackPipe(){
        return multiFilter(function(message){
            drawer.animateLink(message.sender,message.receiver,'green');
        },[{key:'packet_type',value:'ACK'},{key:'type',value:'RECEIVE'}]);
    }

    function dataPipe(){
        return multiFilter(function(message){
            drawer.colorReceiver(message.receiver);
            drawer.animateLink(message.sender,message.receiver,'green');
        },[{key:'packet_type',value:'DATA'},{key:'type',value:'SEND'}]);
    }

    function retryPipe(){
        return multiFilter(function(message){
            drawer.colorReceiver(message.receiver);
            drawer.animateLink(message.sender,message.receiver,'red');
        },[{key:'packet_type',value:'DATA_RETRY'},{key:'type',value:'SEND'}]);
    }

    function multiFilter(callback,filters){
        return tools.filterPipe(new CallMe(callback),filters);
    }

    function appendScrollLine(line){
        /*
        $scope.$apply(function(){
            $scope.scrolltext += line + '\n';
        });
        */
    }
    function setupCanvas(){
        var side = Math.min(window.innerWidth,window.innerHeight);
        var zoom = 1;

        var canvas_width  = side*zoom;
        var canvas_height = side*zoom;

        var canvas = document.getElementById('canvas_container');
        if(!canvas){
            console.log("Cannot find canvas.")
        }
        canvas.setAttribute("style","width:" + canvas_width + "px;height:" + canvas_height + "px");
        drawer.init(canvas);
        drawer.drawDevices(devices);
    }

    function connectWebSocket(url,onmessage){
        var connection = new WebSocket(url, []);

        // When the connection is open, send some data to the server
        connection.onopen = function () {
            connection.send('Ping'); // Send the message 'Ping' to the server
        };

        // Log errors
        connection.onerror = function (error) {
            console.log('WebSocket Error ' + error);
        };

        // Log messages from the server
        connection.onmessage = onmessage;
    }
});