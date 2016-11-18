var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var makePwm;
try{
 	makePwm = require( "adafruit-pca9685" );
}
catch(err){
	console.log("Couldn't load pwm library.")
	makePwm=function(){return {stop:function(){},setPwm:function(){}}}
}

// Configure min and max servo pulse lengths
var servoMin = 150  // Min pulse length out of 4096
var servoMax = 600  // Max pulse length out of 4096
servoMin = 200  // Min pulse length out of 4096
servoMax = 700  // Max pulse length out of 4096


var servoMid = ((servoMin+servoMax)/2)|0
var servoRng = servoMax-servoMin;
var correctionFactor;//=1.118;
var pwm = makePwm({"freq": 60});//, "correctionFactor": 1.118});

function parseConfig(cfg){
	if(cfg.servoMin){
		servoMin = cfg.servoMin|0;
	}
	if(cfg.servoMax){
		servoMax = cfg.servoMax|0;
	}
	servoMid = ((servoMin+servoMax)/2)|0
	servoRng = servoMax-servoMin;
	if(cfg.freq||cfg.correctionFactor){
		if(pwm)
			pwm.stop();
		pwm = makePwm({"freq": cfg.freq?cfg.freq:60, "correctionFactor":cfg.correctionFactor?cfg.correctionFactor:0});

	}
}

parseConfig({servoMin:150,servoMax:600,freq:60,correctionFactor:undefined});


//var pwm = makePwm({"freq": 160, "correctionFactor": 1.118});

//	pwm.setPwm(ch, 0, v); 
//	pwm.setPulse(ch, v); 
//	pwm.stop();

//pwm.setFrequency(60);
//pwm.setPwm(0, 0, servoMid);
//pwm.setPulse(channel, pulse);
pwm.stop();


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});

var serveRoot = "";
var servePort;

var args = process.argv;
if(args.length>2){
	serveRoot = args[2];
}
if(args.length>3){
	servePort = args[3];
}


var port = process.env.PORT || (servePort?servePort:3002)
//var webroot = __dirname;
var webroot = __dirname + '/' + serveRoot;

app.use(express.static(webroot))
var server = http.createServer(app)
server.listen(port)

console.log("http serving:"+webroot+" on port %d", port)

//var playerIdBase=0;
var connections = [];


var wss = new WebSocketServer({server: server})
console.log("websocket server created")


wss.on("connection", function(ws) {

	//ws.playerId = playerIdBase++;

	console.log("websocket connection opened..");//,ws.playerId)

	//GameServer.processEvent({cmd:'connected',obj:ws.playerId},ws); //Broadcast to all

	ws.on("close", function() {
		//GameServer.processEvent({cmd:'disconnected',obj:ws.playerId},ws);
		console.log("websocket connection closed:",ws.playerId)
	})

	ws.on("message",function(msg){
		try{
			var data = JSON.parse(msg);
			//console.log("Got message from:",ws.playerId," : ",msg)
			//data.obj = ws.playerId;	//slam playerID
			//GameServer.processEvent(data,ws);
			if(data.config!=undefined){
				parseConfig(data.config);
			}
			if(data.bones!=undefined){
				for(var i=0;i<data.bones.length;i++){
					var bone = data.bones[i];
					var sval = bone.v|0;
					console.log("c:"+bone.c+" v:"+sval);
					pwm.setPwm(bone.c, 0, sval);
				}
			}
			if(data.stop){
				pwm.stop();
			}
			if(data.restartServer)
				setTimeout(function(){
					//Cause the server to restart....
					console.log("Restarting server....");
					process.exit(0);
				},1000);
		}
		catch(e){
			console.log("Got malformed data from client:",ws.playerId,JSON.stringify(msg));
		}
	});
})
