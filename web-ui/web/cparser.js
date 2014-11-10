(function( tools, undefined ) {
    function nop(){};

    function recFilter(socket,filters){
        if(filters.length==0 || !filters){
            return socket;
        }
        var filter = filters.pop();
        return recFilter(newFilter(socket,filter),filters);
    }

    function newFilter(socket,filter){
        return new Filter(socket,function(msg){
            return msg[filter.key]==filter.value;
        });
    }

    tools.darg = function(arg,def){
        return (typeof arg === "undefined") ? def : arg;
    };

    tools.doCall = function(callback,arg){
        callback = tools.darg(callback,nop);
        callback(arg);
    };

    tools.filterPipe = function(socket,filters){
        return recFilter(socket,filters);
    }
}( window.tools = window.tools || {} ));

//==== Deserialzier
function Deserializer(socket){
    this.socket = socket;
}

Deserializer.prototype.write = function(string,done){
    try{
        var message = JSON.parse(string)
        this.socket.write(message,done);
    }catch (e) {
        tools.doCall(done,new Error('omitted message, could not parse',e))
        return;
    }
    // execute callback, we had no errors
    tools.doCall(done);
}

//==== Filter
function Filter(socket,predicate){
    this.socket = socket;
    this.predicate = predicate;
}

Filter.prototype.write = function(message,done){
    if(this.predicate(message)){
        this.socket.write(message,done);
    }
    // execute callback, we had no errors
    tools.doCall(done);
}

//==== Tee
// write to several sockets
function Tee(sockets){
    this.sockets = sockets;
}

Tee.prototype.write = function(message,done){
    this.sockets.forEach(function(s){
        s.write(message,done);
    });
    // execute callback, we had no errors
    tools.doCall(done);
}

//==== Callback
// execute callback
function CallMe(callback){
    this.callback = callback;
}

CallMe.prototype.write = function(message,done){
    this.callback(message);
    // execute callback, we had no errors
    tools.doCall(done);
}

//---- helpers TODO make private
