function Puppeteer() {
    var app = this.app = new App();
    var prefs = app.getPrefs();
    var connected = false;
    function showStatus(stat){
        statusText.innerHTML = stat;
       
    }


    function interpretLong(data,cbfn){
        cbfn(data[0]|(data[1]<<8)|(data[2]<<16)|(data[3]<<24));
    }

    var sensors={
        sonar:{cmd:0,resp:4,delay:100,parser:interpretLong}
    }
    
    var activeSensor;
    
    function readSensor(name,cb){
        if(!activeSensor){
            var sens = sensors[name];
            sens.cb = cb;
            puppeteer.send({sensor:{cmd:sens.cmd,send:true,data:""}});
            if(sens.resp){
                activeSensor = sens;
                setTimeout(function(){
                    puppeteer.send({sensor:{cmd:0,request:true,data:""}})
                },sens.delay);
            }
        }
    }

    function dispatchSensorReading(data){
        if(activeSensor){
            activeSensor.parser(data,activeSensor.cb);
            activeSensor = undefined;
        }
    }
    
    var sonarPinger = setInterval(function(){
        readSensor('sonar',function(dist){
            showStatus(""+dist);
        });
    },125);

    try {
        var connection = new WebSocket('ws://' + location.host,['soap', 'xmpp']);
        connection.onopen = function() {
            //connection.send('Ping');
            // Send the message 'Ping' to the server
            connected = true;
            showStatus('Connected!');
        }
        // Log errors
        connection.onerror = function(error) {
            showStatus('WebSocket Error ' + error);
        }
        // Log messages from the server
        connection.onmessage = function(e) {
            if(e.data.charAt(0)==='{'){
                var dat = JSON.parse(e.data).rsp;
                dispatchSensorReading(dat);
            }else
                console.log('Server: ' + e.data);
        }
    } catch (err) {
        showStatus("Robot socket not available!")
    }
    var send = this.send = function(obj) {
        if (connected && liveCheckbox.checked) {
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
        var rack = makeMesh("rackPi", 0, 0, 0, -deg90, 0, 0, 0.075);
        var mesh1 = makeMesh("servoSleeveWithMultiConnectors", 0, 0, 1.5, 0, 0, 0, 0.075);
        var strut = makeMesh("quadStrut", 0, 0, -4, deg90, 0, -deg90 * 0.5, 0.075)
        mesh1.bone = arm0.bone = bones.length;
        //mesh1.bone = bones.length+1;
        arm1.bone = foot.bone = bones.length + 1;
        var rad2=rad+1;
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
        mesh.position.z += 0.9;
        joint.position.z += 1.9;
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
            flip:true,
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
        var npwm = (servoMid + (servoRng * bone.value * (bone.flip?0.5:-0.5))) | 0;//grr
        if (bone.pwm == undefined)
            bone.pwm = npwm;
        if (npwm != bone.pwm) {
            bone.dirty = true;
            this.bonesDirty = true;
            bone.pwm = npwm;
        }
    }
    this.tick = function() {
        Pane.animateAll();
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
                    puppeteer.setBone(mesh.bone, bval);
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
    var stlparts = ["foot", "quadStrut", "servoArm", "servoSleeveWithMultiConnectors", "rackPi"];
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
    this.scriptPanel = new ScriptPanel();


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
