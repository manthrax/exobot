
function Timeline() {
    ViewController.call(this, 'Timeline');
    var canv = this.canv = document.createElement('canvas');
    var cctx = this.cctx = canv.getContext('2d');
    this.pane.div.insertBefore(canv, this.pane.textarea);
    this.pane.div.insertBefore(document.createElement('br'), this.pane.textarea);
    this.pane.textarea.remove();
    canv.onmousedown = function(tl) {
        return function(evt) {
            timelineMouseEvent.call(tl, evt);
        }
    }(this);
    canv.onmousemove = function(tl) {
        return function(evt) {
            timelineMouseEvent.call(tl, evt);
        }
    }(this);
    canv.onmousemup = function(tl) {
        return function(evt) {
            timelineMouseEvent.call(tl, evt);
        }
    }(this);
    window.onkeydown = function(tl) {
        return function(evt) {
            timelineKeyEvent.call(tl, evt);
        }
    }(this);
    //canv.style.opacity = '0.5';
    //canv.style.resize = 'both';
    //canv.style.overflow = 'auto';
    this.pane.div.style.overflow = 'hidden';
    //    canv.height = 256;
    //   canv.style['overflow-x']='scroll';
    this.pane.div.style.resize = 'both';
    //this.pane.div.style.overflow='auto';
    //this.statePane.textarea.appendChild(canv);
    this.cctx = cctx;
    this.pane.controller = this;
}
Timeline.prototype = Object.create(ViewController.prototype);


Timeline.prototype.rebuildFromModel = function(){
    this.rebuildChannelIndex();
    this.render();
}

Timeline.prototype.animate = function(){
    if(this.isPlaying){
        this.pane.model.currentFrame++;
        this.pane.model.frameData = this.evaluateAnimationAtFrame(this.pane.model.currentFrame);
        this.render();
    }
}

Timeline.prototype.panelToFrameTime = function(px) {
    return px;
}
Timeline.prototype.frameTimeToPanel = function(ft) {
    return ft;
}
Timeline.prototype.flush = function() {
    var model = this.pane.model;
    model.keymap = {};
    model.keys = [];
    model.channels = {};
    model.frameData = {};
}
Timeline.prototype.evaluateChannelAtFrame = function(chanid, frame) {
    var model = this.pane.model;
    var chan = this.pane.model.channels[chanid];
    for (var i = 0; i < chan.length; i++) {
        var ka = chan[i];
        if (ka.t >= frame)
            return;
        if (i + 1 < chan.length) {
            var kb = chan[i + 1];
            if (kb.t >= frame) {
                var lerp = (frame - ka.t) / (kb.t - ka.t);
                return (kb.v * lerp) + (ka.v * (1 - lerp));
            }
        }
    }
}
Timeline.prototype.evaluateAnimationAtFrame = function(frame) {
    var fdata = {};
    var model = this.pane.model;
    for (var c in this.pane.model.channels) {
        fdata[c] = this.evaluateChannelAtFrame(c, frame);
    }
    for (var c in fdata) {
        var val = fdata[c];
        if (val !== undefined)
            puppeteer.setBone(c, val);
    }
    return fdata;
}
function timelineMouseEvent(evt) {
    if (evt.buttons) {
        this.pane.model.currentFrame = this.panelToFrameTime(evt.offsetX);
        this.pane.model.frameData = this.evaluateAnimationAtFrame(this.pane.model.currentFrame);
        this.render();
    }
}
Timeline.prototype.chanHeight = 32;
Timeline.prototype.removeNearbyKeys = function() {
    var model = this.pane.model;
    for (var i = model.currentFrame - 10; i < model.currentFrame + 10; i++) {
        this.removeKeysAtFrame(i);
    }
    this.rebuildChannelIndex();
    this.render();
}
Timeline.prototype.removeKeysAtFrame = function(cf) {
    var model = this.pane.model;
    var fkeys = model.keymap[cf];
    if (fkeys) {
        for (var i = 0; i < fkeys.length; i++) {
            model.keys.splice(model.keys.indexOf(fkeys[i]), 1);
            //Remove frame keys..
        }
    }
    model.keymap[cf] = [];
}
function compareKeyTime(a, b) {
    return (a.t < b.t) ? -1 : (a.t > b.t) ? 1 : 0;
}
Timeline.prototype.rebuildChannelIndex = function() {
    var model = this.pane.model;
    var chans = model.channels = {};
    for (var k in model.keymap) {
        var keys = model.keymap[k];
        for (i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (!chans[key.c])
                chans[key.c] = [];
            chans[key.c].push(key);
        }
    }
    for (var c in model.channels) {
        var chan = model.channels[c];
        chan.sort(compareKeyTime);
    }
    model.frameData = this.evaluateAnimationAtFrame(model.currentFrame);
}
Timeline.prototype.insertKey = function() {
    //Key
    var model = this.pane.model;
    if (!model.keymap)
        model.keymap = {}
    var cf = model.currentFrame | 0;
    this.removeKeysAtFrame(cf);
    var ka = model.keymap[cf] = [];
    for (var i = 0; i < puppeteer.bones.length; i++) {
        var bon = puppeteer.bones[i];
        var key = {
            t: cf,
            c: i,
            v: bon.value
        };
        model.keys.push(key);
        ka.push(key);
    }
    this.rebuildChannelIndex();
    this.render();
}
function timelineKeyEvent(evt) {
    if (evt.key == 'ArrowRight') {
        this.pane.model.currentFrame++;
        this.render();
    } else if (evt.key == 'ArrowLeft') {
        this.pane.model.currentFrame--;
        this.render();
    } else if (evt.key == 'i') {
        this.insertKey();
    } else if (evt.key == 'Delete') {
        this.removeNearbyKeys();
    }else if (evt.key == 'a' && evt.altKey) {
        this.play();
    }else if (evt.key == 'Escape') {
        this.stop();
    }
}
Timeline.prototype.play = function(){
    this.isPlaying = true;
    this.playStartFrame = this.pane.model.currentFrame;
}
Timeline.prototype.stop = function(){
    if(this.isPlaying){
        this.pane.model.currentFrame = this.playStartFrame;
        this.isPlaying = false;
    }
}

Timeline.prototype.render = function() {
    var canv = this.canv;
    var cctx = this.cctx;
    canv.width = 2000;
    canv.height = 256;
    cctx.fillStyle = 'rgba(128,128,128,0.75)';
    cctx.fillRect(0, 0, canv.width, canv.height);
    var model = this.pane.model;
    if (model.channels) {
        var chns = model.channels;
        cctx.beginPath();
        for (var ck in chns) {
            var chn = chns[ck];
            if (chn.length > 1) {
                var ci = chn[0].c;
                var cy = (ci * this.chanHeight) + (this.chanHeight * 0.5);
                for (var i = 0; i < chn.length - 1; i++) {
                    cctx.moveTo(this.frameTimeToPanel(chn[i].t), cy + ((this.chanHeight * 0.5) * chn[i].v));
                    cctx.lineTo(this.frameTimeToPanel(chn[i + 1].t), cy + ((this.chanHeight * 0.5) * chn[i + 1].v));
                }
            }
        }
        cctx.stroke();
    }
    if (model.keys) {
        var keys = model.keys;
        cctx.fillStyle = 'Black';
        for (var l = keys.length, i = 0; i < l; i++) {
            var k = keys[i];
            var px = k.t;
            var py = (k.c * this.chanHeight) + (this.chanHeight * 0.5) + ((this.chanHeight * 0.5) * k.v);
            cctx.strokeRect(px - 4, py - 4, 8, 8);
        }
    }
    cctx.strokeStyle = 'Black';
    cctx.beginPath();
    cctx.setLineDash([1, 4]);
    for (var left = 0, dleft = 0; dleft < canv.width; left += 60) {
        dleft = this.frameTimeToPanel(left);
        cctx.moveTo(dleft, 0);
        cctx.lineTo(dleft, canv.height);
    }
    for (var top = 0, dtop = 0; dtop < canv.height; top += 1) {
        dtop = top * this.chanHeight;
        cctx.moveTo(0, dtop);
        cctx.lineTo(canv.width, dtop);
    }
    cctx.closePath()
    cctx.stroke();
    if (model.currentFrame) {
        var px = this.frameTimeToPanel(model.currentFrame);
        cctx.beginPath();
        cctx.moveTo(px, 0);
        cctx.lineTo(px, canv.height);
        cctx.stroke();
        if (model.frameData) {
            cctx.beginPath();
            //  cctx.setLineDash([]);
            for (var c in model.frameData) {
                var val = model.frameData[c];
                var py = (c * this.chanHeight) + (this.chanHeight * 0.5);
                py += this.chanHeight * 0.5 * val;
                cctx.arc(px, py, 4, 0, 2 * Math.PI);
            }
            cctx.closePath()
            cctx.fill();
        }
    }
}