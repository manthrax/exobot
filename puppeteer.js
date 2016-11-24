function Puppeteer() {
    var app = this.app = new App();
    var prefs = app.getPrefs();
    var connected = false;
    try {
        var connection = new WebSocket('ws://' + location.host,['soap', 'xmpp']);
        connection.onopen = function() {
            //connection.send('Ping');
            // Send the message 'Ping' to the server
            connected = true;
            statusText.innerHTML = 'Connected!';
        }
        // Log errors
        connection.onerror = function(error) {
            showStatus('WebSocket Error ' + error);
        }
        // Log messages from the server
        connection.onmessage = function(e) {
            console.log('Server: ' + e.data);
        }
    } catch (err) {
        showStatus("Robot socket not available!")
    }
    var send = this.send = function(obj) {
        if (connected) {
            try {
                connection.send(JSON.stringify(obj));
            } catch (err) {
                showStatus(err);
                connected = false;
            }
        }
    }
    var geometry = new THREE.CylinderGeometry(2.5,2.5,0.5,nseg);
    //BoxGeometry( 5, 5, 5 );
    var body = new THREE.Object3D();
    //body.rotation.x = Math.PI;
    app.scene.add(body);
    var bones = this.bones = [];
    var boneMeshes = app.pickables;
    // Configure min and max servo pulse lengths
    var servoMin = 200
    // Min pulse length out of 4096
    var servoMax = 650
    // Max pulse length out of 4096
    var servoMid = ((servoMin + servoMax) / 2) | 0
    var servoRng = servoMax - servoMin;
    var jointRangeRadians = Math.PI * 0.5;
    var selectedBone;
    this.meshMoved = function(evt, buttons) {
        if (selectedBone != undefined && buttons == 1) {
            var bval = selectedBone.value + (selectedBone.axis == 'y' ? evt.movementX : evt.movementY) * 0.01;
            forEachSelectedMesh(function(mesh) {
                if ((mesh.bone !== undefined) && (bones[mesh.bone].axis == selectedBone.axis)) {
                    puppeteer.setBone(mesh.bone, bval);
                }
            });
        }
    }
    function forEachSelectedMesh(fn) {
        if (allCheckbox.checked) {
            for (var i = 0; i < boneMeshes.length; i++) {
                fn(boneMeshes[i]);
            }
        } else if (selectedMesh) {
            fn(selectedMesh)
        }
    }
    var specularBoost = 0.1;
    var specularScale = 3;
    this.colorSelected = function(str, col) {
        forEachSelectedMesh(function(msh) {
            //msh.material = msh.material.clone();
            msh.material.color.setRGB(col[0], col[1], col[2]);
            msh.material.specular.setRGB((col[0] + specularBoost) * specularScale, (col[1] + specularBoost) * specularScale, (col[2] + specularBoost) * specularScale);
        });
    }
    var jointsByMeshId = {};
    var meshDB = app.meshDB;
    function makeMesh(name, x, y, z, rx, ry, rz, s) {
        var mesh = meshDB[name].clone();
        mesh.position.set(x ? x : 0, y ? y : 0, z ? z : 0)
        mesh.rotation.set(rx ? rx : 0, ry ? ry : 0, rz ? rz : 0, 'XYZ');
        s = s ? s : 1.0
        mesh.scale.set(s, s, s);
        var pcol = prefs.colors[mesh.id];
        mesh.userData.material = mesh.material.clone();
        mesh.material = mesh.material.clone();
        if (pcol) {
            mesh.userData.material.color.setRGB(pcol[0], pcol[1], pcol[2]);
            //mesh.material = new THREE.MeshBasicMaterial();
            mesh.material.color.setRGB(pcol[0], pcol[1], pcol[2]);
        }
        return mesh;
    }
    function seg(ang, rad) {
        var joint = new THREE.Object3D();
        var joint1 = new THREE.Object3D();
        var shoulder = new THREE.Object3D();
        /*
        var material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            specular: 0x111111,
            shininess: 100
        });*/
        var deg180 = Math.PI;
        var deg90 = Math.PI * 0.5;
        var geometry = new THREE.BoxGeometry(1,1,2);
        var mesh = makeMesh("servoSleeveWithMultiConnectors", 0, 0, -0.6, 0, 0, 0, 0.075);
        var foot = makeMesh("foot", 0.15, 0, 2.4, 0, 0, Math.PI * 0.5, 0.075);
        var arm0 = makeMesh("servoArm", 0.4, -0.45, -0.5, -deg90, -deg90, 0, 0.075);
        var arm1 = makeMesh("servoArm", -0.5, -0.3, -0.3, -deg90, 0, 0, 0.075);
        var rack = makeMesh("rack", 0, 0, 0, 0, 0, -deg90, 0.075);
        var mesh1 = makeMesh("servoSleeveWithMultiConnectors", 0, 0, 1.5, 0, 0, 0, 0.075);
        var strut = makeMesh("quadStrut", 0, 0, -4, deg90, 0, -deg90 * 0.5, 0.075)
        mesh1.bone = arm0.bone = bones.length;
        //mesh1.bone = bones.length+1;
        arm1.bone = foot.bone = bones.length + 1;
        shoulder.position.x = Math.sin(ang) * rad * 0.5;
        shoulder.position.z = Math.cos(ang) * rad * 0.5;
        shoulder.rotation.y = ang;
        body.add(shoulder);
        body.add(rack);
        shoulder.add(joint);
        joint.add(joint1);
        shoulder.add(mesh);
        shoulder.add(strut);
        joint.add(arm0)
        joint.add(mesh1)
        joint1.add(arm1)
        joint1.add(foot)
        boneMeshes.push(arm0)
        boneMeshes.push(arm1)
        boneMeshes.push(mesh1)
        boneMeshes.push(foot)
        boneMeshes.push(mesh)
        boneMeshes.push(strut)
        boneMeshes.push(rack)
        mesh.rotation.z = Math.PI * 0.5
        joint.position.z += 1.0;
        joint1.position.z += 2.8;
        var joint = jointsByMeshId[mesh1.id] = jointsByMeshId[arm0.id] = {
            axis: 'y',
            joint: joint,
            value: prefs.bones[bones.length] ? prefs.bones[bones.length].value : 0
        }
        bones.push(joint);
        joint = jointsByMeshId[foot.id] = jointsByMeshId[arm1.id] = {
            axis: 'x',
            joint: joint1,
            value: prefs.bones[bones.length] ? prefs.bones[bones.length].value : 0
        }
        bones.push(joint)
        //			shoulder.add( new THREE.BoxHelper( mesh ) );
    }
    this.saveState = function(prefs) {
        for (var i = 0; i < bones.length; i++) {
            prefs.bones[i] = {
                value: bones[i].value
            };
        }
        Pane.prototype.saveState(prefs);
    }
    // window.addEventListener('beforeunload',saveState);
    // window.addEventListener('beforeunload',function(e){return 'AAAAA!!!'});
    this.setBone = function(i, bval) {
        var bone = bones[i];
        bone.value = bval;
        bone.value = bone.value < -1 ? -1 : bone.value > 1 ? 1 : bone.value;
        var ang = bone.value * jointRangeRadians;
        bone.joint.rotation[bone.axis] = ang;
        var npwm = (servoMid + (servoRng * bone.value * 0.5)) | 0;
        if (bone.pwm == undefined)
            bone.pwm = npwm;
        if (npwm != bone.pwm) {
            bone.dirty = true;
            this.bonesDirty = true;
            bone.pwm = npwm;
        }
    }
    this.tick = function() {
        if (!this.bonesDirty)
            return;
        this.bonesDirty = false;
        var pkt = {
            bones: []
        };
        for (var ct = this.bones.length, i = 0; i < ct; i++) {
            var bone = this.bones[i];
            if (bone.dirty) {
                pkt.bones.push({
                    c: i,
                    v: bone.pwm
                })
            }
        }
        if (pkt.bones.length) {
            send(pkt);
        }
    }
    function angleChanged(evt) {
        if (selectedBone) {
            var bval = ((angleSlider.value | 0) / 50) - 1;
            var ang = selectedBone.value * jointRangeRadians;
            forEachSelectedMesh(function(mesh) {
                if ((mesh.bone !== undefined) && (bones[mesh.bone].axis == selectedBone.axis)) {
                    this.setBone(mesh.bone, bval);
                }
            })
        }
    }
    var selectedMesh;
    this.doSelectMesh = function(newlySelectedMesh) {
        selectedMesh = newlySelectedMesh;
        selectedBone = jointsByMeshId[selectedMesh.id];
        if (selectedBone) {
            angleSlider.value = (selectedBone.value + 1) * 50;
        }
    }
    var texLoader = new THREE.TextureLoader();
    var groundMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        specular: 0x111111,
        shininess: 50,
        map: texLoader.load("woodfloor.jpg")
    });
    groundMat.map.repeat.set(2, 2);
    groundMat.map.wrapS = groundMat.map.wrapT = THREE.RepeatWrapping;
    groundMat.map.offset.set(0.5, 0.5);
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(150,150,5,5),groundMat);
    ground.rotation.x = Math.PI * 1.5;
    ground.position.y -= 4;
    ground.castShadow = false;
    ground.receiveShadow = true;
    app.scene.add(ground);
    var stlparts = ["foot", "quadStrut", "servoArm", "servoSleeveWithMultiConnectors", "rack"];
    for (var i = 0; i < stlparts.length; i++)
        app.loadMeshSTL('./design/' + stlparts[i] + '.stl', stlparts[i]);
    var nseg = 4;
    var pi2 = Math.PI * 2;
    this.buildBot = function() {
        /*
        var mesh = new THREE.Mesh(geometry,material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        body.add(mesh);
*/
        for (var i = 0; i < nseg; i++)
            seg(((pi2 / nseg) * i) + (pi2 / 8), 8);
        for (var i = 0; i < bones.length; i++) {
            if (prefs.bones[i])
                this.setBone(i, prefs.bones[i].value)
        }
        angleSlider.oninput = angleChanged;
    }
    this.actionPanel = new ActionPanel();
    this.posePanel = new PosePanel();
    this.timelinePanel = new Timeline();


}
function start() {
    var puppeteer = window.puppeteer = new Puppeteer();
    /*----------------------------------*/
//    var smworld = new SMWorld(puppeteer.app);
    /*-----------------------------*/
}

Puppeteer.prototype.importModel = function(model){
    this.timelinePanel.pane.model = model;
    this.timelinePanel.pane.state.model = model;
    this.timelinePanel.render();
}

Puppeteer.prototype.exportModel = function(){
    //this.userDownload("botmodel.json",JSON.stringify(this.timelinePanel.pane.model));
    this.userDownload("botstate.json",JSON.stringify(this.app.getState()));
}

Puppeteer.prototype.userDownload = function(filename, text) {
    var element = document.createElement('a');
    if (typeof text == 'string') {
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    } else if (typeof text == 'object') {
        //var b64encoded = Uint8ToString(text);
        var url = window.URL.createObjectURL(new Blob([text],{
            type: 'application/octet-stream'
        }));
        element.setAttribute('href', url);
        //'data:binary;base64,' + b64encoded);
    }
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
;
function AppPanel(id) {
    this.pane = new Pane(id);
    this.panels.push(this.pane);
}
AppPanel.prototype.panels = [];



AppPanel.prototype.rebuildFromModel = function(){
}




function Timeline() {
    AppPanel.call(this, 'Timeline');
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
Timeline.prototype = Object.create(AppPanel.prototype);


Timeline.prototype.rebuildFromModel = function(){
    this.rebuildChannelIndex();
    this.render();
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
function PosePanel() {
    AppPanel.call(this, 'Poses');
}
PosePanel.prototype = Object.create(AppPanel.prototype);
function ActionPanel() {
    AppPanel.call(this, 'Actions');
}
ActionPanel.prototype = Object.create(AppPanel.prototype);
