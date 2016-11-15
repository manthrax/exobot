
var picklet = function(){
    var actx = {};

    function irnd(rng){return parseInt(Math.random()*rng);}
    function rgba(r,g,b,a){return 'rgba('+r+','+g+','+b+','+a+')';}
    actx.randomColor = function randomColor(){return rgba(irnd(255),irnd(255),irnd(255),Math.random());}
    actx.randomSolidColor = function randomSolidColor(){return rgba(irnd(255),irnd(255),irnd(255),1);}

    var huelut=[[1,0,0],[1,1,0],[0,1,0],[0,1,1],[0,0,1],[1,0,1],[1,0,0]];
    var hblack=[0,0,0];
    var hwhite=[1,1,1];

    function clamp(val,min, max) {  return Math.min(Math.max(val, min?min:0), max?max:1);};
    function lerp(va,vb,vv){return va+((vb-va)*vv);}
    function HSVToRGB(h,s,v){
        var la = h*5.9999;
        var sa = parseInt(la);
        var ca = la-sa;
        var hsa=huelut[sa];
        var hsb=huelut[sa+1];
        var rgb=[0,0,0];
        for(var t=0;t<3;t++)rgb[t]=lerp(0,lerp(1,lerp(hsa[t],hsb[t],ca),s),v);
        
        return rgb;
    }

	function RGBToHSV(r,g,b)
	{
		var max = r;
		if (max < g) max = g;
		if (max < b) max = b;
		var min = r;
		if (min > g) min = g;
		if (min > b) min = b;
		
		/*
		 *	Calculate h
		 */
		
		var h,s,v;
		h=s=v=0;
		if (max == min) h = 0;
		else if (max == r) {
			h = 60 * (g - b)/(max - min);
			if (h < 0) h += 360;
			if (h >= 360) h -= 360;
		} else if (max == g) {
			h = 60 * (b - r) / (max - min) + 120;
		} else if (max == b) {
			h = 60 * (r - g) / (max - min) + 240;
		}
		h /= 360.0;
		if (max == 0) s = 0;
		else s = 1 - (min / max);
		v = max;
		return [h,s,v];
	}


    function colFloatToRGBAStr(rgb,a){
        var ff=255.999;
        return rgba(parseInt(rgb[0]*ff),parseInt(rgb[1]*ff),parseInt(rgb[2]*ff),a?a:1.0);    	
    }

    function vecLen(vec){return (vec.x!=0||vec.y!=0)?Math.sqrt((vec.x*vec.x)+(vec.y*vec.y)):0;}

    function vecToHSV(vec,vlen){
        vlen = clamp(vlen);
        return[(Math.atan2(vec.x,vec.y)/(Math.PI*2))+0.5,vlen>0.5?1:vlen/0.5,vlen>0.5?(1.0-vlen)*2:1];
    }
	
	actx.createCanvasButton=function (cfg){
		var rtn = cfg;
		var c = rtn.canvas = document.createElement("canvas");
		c.width = c.height = rtn.size = rtn.size?rtn.size:32;
		rtn.r1 = rtn.size*0.47;
		var parent = rtn.parent?document.getElementById(rtn.parent):document.body;
		parent.appendChild(c);
		rtn.ctx = c.getContext('2d');
		c.parentButton=rtn;
		rtn.foreColor = rtn.foreColor?rtn.foreColor:"white";
		rtn.backColor = rtn.backColor?rtn.backColor:"black";
		rtn.drawButton=function(){
			this.ctx.fillStyle = this.foreColor;
			this.ctx.strokeStyle = "black";
			this.ctx.arc(this.canvas.width/2,this.canvas.height/2,this.r1,0,Math.PI*2);
			this.ctx.fill();
			this.ctx.stroke();
			this.ctx.fillStyle = this.backColor;
			this.ctx.fillText("FS", 4,this.canvas.height/2);			
		}
		if(!rtn.paint)
			rtn.paint=function(){
				this.drawButton();
			}
		rtn.paint();

		rtn.newhandler=function(name,fn){
			return function(evt){
				fn(evt);
				if(this.parentButton[name])this.parentButton[name].call(this.parentButton,evt);
			}
		}
		c.addEventListener ("mouseout",rtn.newhandler("mouseout",function(evt){mouseDown=false;}), false);
        c.addEventListener('mousemove',rtn.newhandler("mousemove",function(evt){}));
        c.addEventListener('mousedown',rtn.newhandler("mousedown",function(evt){mouseDown=true;}));
        c.addEventListener('mouseup',rtn.newhandler("mouseup",function(evt){mouseDown=false;}));
		return rtn;
	}
		
    actx.create=function (parent,size,onpick,incolor){
		var rootCanvas = document.createElement("canvas");
		rootCanvas.width=rootCanvas.height = size;
		document.getElementById(parent).appendChild(rootCanvas);
        var pctx = rootCanvas.getContext('2d');
		
        var ccanvas = document.createElement('canvas');
        ccanvas.width=rootCanvas.width;
        ccanvas.height=rootCanvas.height;
        var cctx = ccanvas.getContext('2d');
        var pdim = rootCanvas.height,hdim=pdim*0.5;
        var pickedColor;
        var pickedColorHSV;
        var pickedColorRGB;
        var colorQueue = [[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
        var colorQueueIndex = 0;
    function paintColorQueue(){
         for(var y=0;y<pdim;y++){
            for(var x=0;x<pdim;x++){
                //if(Math.random()>0.5)continue;
                var vec = {x:(x-hdim)/hdim,y:(y-hdim)/hdim};
                var vlen = vecLen(vec);
                var hsv = vecToHSV(vec,vlen);
                var alpha = 1.0;
                if(vlen>0.9){
                    alpha=clamp(1.0-((vlen-0.9)/0.1),0.01,1.0);
                    var qid = (vec.x>0)?((vec.y<0)?0:1):((vec.y<0)?3:2);
                    for(var i=0;i<3;i++)hsv[i]=colorQueue[qid][i];
                    alpha = 1;
                    cctx.fillStyle=colFloatToRGBAStr(HSVToRGB(hsv[0],hsv[1],hsv[2]),alpha);
                    cctx.fillRect(x,y,1,1);
                }
            }
        }
    }
		function repaint(){
            var pdim = rootCanvas.height,hdim=pdim*0.5;
	   pctx.globalCompositeOperation = "source-in";
			pctx.fillStyle = rgba(255,0,0,0.01);
			pctx.fillRect(0,0,pdim,pdim);
	   pctx.globalCompositeOperation = "normal";
			pctx.drawImage(ccanvas,0,0);

			pctx.fillStyle = pickedColor;
			pctx.strokeStyle='black';
			var pdim = parseInt(hdim*0.1);
			pctx.beginPath();

			var hsv = pickedColorHSV;
			var ca = -Math.sin(hsv[0]*Math.PI*2);
			var sa = -Math.cos(hsv[0]*Math.PI*2);
			var mag = hsv[2]<1.0?0.5+(0.5-(hsv[2]*0.5)):(hsv[1]*0.5);

			var px = hdim+(ca*hdim*mag);
			var py = hdim+(sa*hdim*mag);

//			var vscl = hdim*(vlen>1.0?1.0/vlen:1.0);
//			var px=(vec.x*vscl)+hdim;
//			var py=(vec.y*vscl)+hdim;

			pctx.arc(px,py,pdim,0,2*Math.PI);
			pctx.fill();
			pctx.stroke();

		}
		
		function setHSV(hsv){  
			pickedColorHSV = hsv;
			pickedColorRGB = HSVToRGB(hsv[0],hsv[1],hsv[2]);            
			pickedColor = colFloatToRGBAStr( pickedColorRGB );
            colorQueue[colorQueueIndex]=[hsv[0],hsv[1],hsv[2]];
		}

		
        for(var y=0;y<pdim;y++){
            for(var x=0;x<pdim;x++){
                //if(Math.random()>0.5)continue;
                var vec = {x:(x-hdim)/hdim,y:(y-hdim)/hdim};
                var vlen = vecLen(vec);
                var hsv = vecToHSV(vec,vlen);
                var alpha = 1.0;
                if(vlen>0.9){
                    alpha=clamp(1.0-((vlen-0.9)/0.1),0.01,1.0);
                    var qid = (vec.x>0)?((vec.y<0)?0:1):((vec.y<0)?3:2);
                    for(var i=0;i<3;i++)hsv[i]=colorQueue[qid][i];
                    alpha = 1;
                }
                cctx.fillStyle=colFloatToRGBAStr(HSVToRGB(hsv[0],hsv[1],hsv[2]),alpha);
                cctx.fillRect(x,y,1,1);
            }
        }
        paintColorQueue();
        pctx.fillStyle = rgba(255,255,255,0.01);
        pctx.fillRect(0,0,pdim,pdim);
        //pctx.drawImage(ccanvas,0,0);

		if(incolor){
			setHSV(RGBToHSV(incolor[0],incolor[1],incolor[2]));
		}	
		repaint();
		
		
        var mouseDown = false;
		var grown = false;
		function pickfn(evt){
			var wasQ = doPick(evt);
			if(onpick&&pickedColor)
				if(mouseDown){
				    onpick(pickedColor,pickedColorRGB);
				
                    paintColorQueue();
				}else{
                    if(!wasQ)
                        colorQueueIndex = (colorQueueIndex + 1)%4;
				}
			if(grown==false){
				grown = true;
			}
		}
		
		function shrink(){
			if(grown==true){
				grown = false;
			}
		}
		
        function doPick(evt){
            if(!mouseDown)return;
            evt.preventDefault();
			
            var vec={x:(evt.offsetX-hdim)/hdim,y:(evt.offsetY-hdim)/hdim};
            var vlen = vecLen(vec);
        	
        	var hsv = vecToHSV(vec,vlen);
        	var wasQ = false;
            if(vlen>1.0){
                var qid = (vec.x>0)?((vec.y<0)?0:1):((vec.y<0)?3:2);
                for(var i=0;i<3;i++)hsv[i]=colorQueue[qid][i];
                wasQ=true;
            }
			setHSV(hsv);

			repaint();
            return wasQ;
        }
		
		rootCanvas.addEventListener ("mouseout",function(evt){mouseDown=false}, false);
        rootCanvas.addEventListener('mousemove',pickfn);
        rootCanvas.addEventListener('mousedown',function(evt){mouseDown=true;pickfn(evt);});
        rootCanvas.addEventListener('mouseup',function(evt){mouseDown=false;pickfn(evt);});
        //rootCanvas.addEventListener('click',doPick);
		return rootCanvas;
    }
    return actx;
}();