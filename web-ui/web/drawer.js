/**
 * Created by trichner on 14.10.14.
 */

(function( drawer, undefined ) {

    var nodeMap = {};
    var paper;

    drawer.init = function(canvas){
        paper = initRaphael(canvas);
        drawLogo();
        var mCounter = drawCounter();
        paper.mCounter = mCounter;
    }

   //Public Method
    drawer.drawDevices = function(devices) {
        drawDevices(devices)
    };

    drawer.updateText = function(addr,ntxt,txt){
        setText(nodeMap[addr].txt[ntxt],txt);
    }

    drawer.updateCount = function(txt){
        setText(paper.mCounter,txt)
    }

    drawer.colorReceiver = function(dst){
        colorReceiver(nodeMap[dst].circle);
    };

    drawer.animateLink = function(src,dst,color){
        var nsrc,ndst;
        nsrc = nodeMap[src].circle;
        ndst = nodeMap[dst].circle;
        animateLink(nsrc,ndst,color);
    }

    drawer.debugLink = function(node1,node2){
        setTimeout(function() {
            animateLink(node1,node2);
        },1000);
    }

    //==== Private Methods
    function darg(arg,def){
        return (typeof arg === "undefined") ? def : arg;
    }

    // width, height, zoom, container id
    function initRaphael(canvas){
        //container = darg(container,'canvas_container');
        //var canvas = document.getElementById(container);
        return new Raphael(canvas, "100%", "100%");
    }

    function setText(t1,txt){
        t1.attr({text:txt});
    }

    function drawCounter(){
        var dp = dimPaper(paper);
        var fontSize =1/20*dp[1];
        var margin = 1/50*dp[1];
        var t2 = paper.text(margin, margin, 'Total sent packages: 0');

        t2.attr({
            'font-size': fontSize,
            'text-anchor': 'start'
        });

        return t2;
    }

    function drawLogo(){
        var dm = dimPaper(paper);
        var img = new Image();
        var url = "logo.png";

        img.onload = function() {
            // scaling
            var w, h, x, y, z, s;
            w = img.width;
            h = img.height;
            s = Math.max(w,h);
            z = Math.min(dm[0]/4,s)/s;
            w *= z;
            h *= z;
            x = dm[0] - w;
            y = dm[1] - h;
            x /= 2;
            y /= 2;
            paper.image(url,x,y,w,h);
        };

        img.src = url;
    }

    function drawDevices(devices){
        var dp = dimPaper(paper);

        //==== setup our little circle
        var circle_radius = 1/10 * dp[0]/2;

        var cx = dp[0]/2;
        var cy = dp[1]/2;
        var spread_radius = Math.min(cx,cy)*3/4;

        var nNodes = devices.length;
        devices.forEach(function(device,i){
            var alpha = i/nNodes*Math.PI*2;
            var x, y,dx,dy;
            dx = Math.cos(alpha)*spread_radius;
            dy = Math.sin(alpha)*spread_radius;
            x = dx + cx;
            y = dy + cy;
            drawDevice(x,y,circle_radius,device);

        })
    }

    function drawDevice(x,y,R,dev){
        var circle = paper.circle(x, y, R);

        circle.attr({
            'stroke-width': 4,
            'stroke': 'green',
            'fill' : 'white'
        });

        drawText(paper,circle,dev.address);

        var fontSize = R*1/2;
        var offset = 4/3*R;
        var margin = 1/10*fontSize;
        var spacing = offset+fontSize+margin;

        var t1 = paper.text(x, y+offset, '0');
        t1.attr('font-size',fontSize);

        fontSize = 3/4* fontSize;
        var t2 = paper.text(x, y+spacing, '0');
        t2.attr('font-size',fontSize);

        spacing += fontSize+margin;
        var t3 = paper.text(x, y+spacing, '0');
        t3.attr('font-size',fontSize);


        nodeMap[dev.address] = {};
        nodeMap[dev.address].circle = circle;
        nodeMap[dev.address].txt = [t1,t2,t3];
    }

    function drawLink(node1,node2,style){
        var style = darg(style,{});
        var d1 = getXYR(node1),d2 = getXYR(node2);

        var path = "M"+d1[0]+","+d1[1];
        path += "L" + d2[0] + "," + d2[1];
        var line = node1.paper.path(path);
        line.toBack();
        return line;
    }

    function colorReceiver(dst){
        // color the receiver
        dst.attr({
            'stroke': 'black'
        });

        dst.animate({stroke: 'green'},10000,'<>',function(){

        });
    }

    function animateLink(src,dst,color){
        // draw a colored link
        var style = {
            'stroke-width' : 8,
            'stroke' : color,
            'stroke-opacity':0.6
        }
        var line = drawLink(src,dst);

        line.attr(style);
        line.animate({'stroke-opacity': 0,'stroke-width': 0},1000,'<>',function(){
            line.remove();
        });

        /* buggy
         var midpoint = line.getPointAtLength(1/4*line.getTotalLength());
        var arrow = drawArrow(midpoint);
        arrow.attr(style);
        arrow.animate({'stroke-opacity': 0,'stroke-width': 0},1000,'<>',function(){
            arrow.remove();
        });
        */
    }

    function drawArrow(position){
        var x = position.x;
        var y = position.y;
        var a = position.alpha;
        var width = 15;
        var height = 20;
        var path = "M"+x+","+y;
        path += "l-" +width +" -" + (height/2);
        path += "l0 "+height;
        path += "z";
        var line = paper.path(path);
        line.transform("T" + width/2 + "," + 0 +"R"+a)
        return line;
    }

    function drawText(paper,node,text){
        var d = getXYR(node);
        var t = paper.text(d[0], d[1], text);
        t.attr('font-size',d[2]*2/3)
    }

    function getXYR(node){
        var x = node.attr('cx');
        var y = node.attr('cy');
        var r = node.attr('r');
        return [x,y,r];
    }

    function dimPaper(paper){
        return [paper.canvas.offsetWidth,paper.canvas.offsetHeight];
    }
}( window.drawer = window.drawer || {} ));


