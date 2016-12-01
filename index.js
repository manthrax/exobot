var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var fs = require("fs");
var app = express()

var i2c = require("i2c");


var sensorLink = new i2c(0x08, {device: '/dev/i2c-1'});

var clientSock;

function log(params){
	var str="";
	for (var i = 0; i < arguments.length; i++)str+=arguments[i];
	if(clientSock)
		clientSock.send(str);
	console.log(str);
}


sensorLink.on('data', function(data) {
	log("Got data from sensor:",JSON.stringify(data));
});



var makePwm;
try{
 	makePwm = require( "adafruit-pca9685" );
}
catch(err){
	log("Couldn't load pwm library.")
	makePwm=function(){return {stop:function(){},setPwm:function(){}}}
}

var correctionFactor;//=1.118;
var pwm = makePwm({"freq": 60});//, "correctionFactor": 1.118});

function parseConfig(cfg){
	log(cfg)
	if(cfg.freq||cfg.correctionFactor){
		if(pwm)
			pwm.stop();
		pwm = makePwm({"freq": cfg.freq?cfg.freq:60, "correctionFactor":cfg.correctionFactor?cfg.correctionFactor:0});
	}
	log("Parsed config.");
}

parseConfig({servoMin:200,servoMax:700,freq:60,correctionFactor:undefined});


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
  log(index + ': ' + val);
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


var port = process.env.PORT || (servePort?servePort:80)
//var webroot = __dirname;
var webroot = __dirname + '/' + serveRoot;

app.use(express.static(webroot))
var server = http.createServer(app)
server.listen(port)

log("http serving:"+webroot+" on port %d", port)

//var playerIdBase=0;
var connections = [];


var wss = new WebSocketServer({server: server})
log("websocket server created")

function strToAsciiArray(str){var arr=[]; for(var i=0;i<str.length;i++)arr.push(str.charCodeAt(i));return arr;}

wss.on("connection", function(ws) {
	clientSock = ws;
	//ws.playerId = playerIdBase++;

	log("websocket connection opened..");//,ws.playerId)

	//GameServer.processEvent({cmd:'connected',obj:ws.playerId},ws); //Broadcast to all

	ws.on("close", function() {
		clientSock = undefined;
		//GameServer.processEvent({cmd:'disconnected',obj:ws.playerId},ws);
		log("websocket connection closed:",ws.playerId)
	})

	ws.on("message",function(msg){
		try{
			var data = JSON.parse(msg);
			//log("Got message from:",ws.playerId," : ",msg)
			//data.obj = ws.playerId;	//slam playerID
			//GameServer.processEvent(data,ws);
			if(data.config!=undefined){
				parseConfig(data.config);
			}
			if(data.bones!=undefined){
				var sstr ="";
				for(var i=0;i<data.bones.length;i++){
					var bone = data.bones[i];
					var sval = bone.v|0;
					sstr+="c:"+bone.c+" v:"+sval;
					pwm.setPwm(bone.c, 0, sval);
				}
				log(sstr);
			}
			if(data.stop){
				pwm.stop();
			}
			if(data.restartServer)
				setTimeout(function(){
					//Cause the server to restart....
					log("Restarting server....");
					process.exit(0);
				},100);
			if(data.killServer)
				setTimeout(function(){
					//Cause the server to restart....
					log("Killing server....");
					process.exit(-1);
				},100);
			if(data.burnToBot){
				var stream = fs.createWriteStream(data.burnToBot.path);
				stream.once('open', function(fd) {
				  stream.write(data.burnToBot.data);
				  stream.end();
				});
			}
			if(data.sensor){
				if(data.sensor.send){
					if(typeof data.sensor.data === 'string'){//Speak
						sensorLink.writeBytes(data.sensor.cmd,strToAsciiArray(data.sensor.data),function err(e,d){
							log("SensorLink write callback:"+JSON.stringify(e)+":"+JSON.stringify(d));
						});
					}else{
						sensorLink.writeBytes(data.sensor.cmd,data.sensor.data,function err(e,d){
							log("SensorLink write callback:"+JSON.stringify(e)+":"+JSON.stringify(d));
						});
					}
				}else if(data.sensor.request){
					sensorLink.readBytes(8, 4, function(err, res) {
					  // result contains a buffer of bytes 
						log("SensorLink read callback!"+JSON.stringify(err)+":"+JSON.stringify(res));
					});					
				}
			}
		}
		catch(e){
			log("Got malformed data from client:",ws.playerId,JSON.stringify(msg));
		}
	});
})
