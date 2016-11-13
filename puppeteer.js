function start() {
    var connected = false;
    function showStatus(str) {
        console.log(str);
        statusText.innerHTML = str;
    }
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
    function send(obj) {
        if (connected) {
            try {
                connection.send(JSON.stringify(obj));
            } catch (err) {
                showStatus(err);
                connected = false;
            }
        }
    }
    stopButton.onclick = function(e) {
        send({
            stop: true
        });
    }
    resetButton.onclick = function(e) {
        send({
            restartServer: true
        });
        setTimeout(function() {
            location.reload();
        }, 5000);
    }
	var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;
    var renderer = new THREE.WebGLRenderer({
        canvas: canv,
        //shadowMapEnabled: true
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.soft = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    var raycaster = new THREE.Raycaster();
    renderer.setSize(window.innerWidth, window.innerHeight);
    var scene = new THREE.Scene();
    var nseg = 4;
    var pi2 = Math.PI * 2;
    var camera = new THREE.PerspectiveCamera(35,// Field of view
    window.innerWidth / window.innerHeight,// Aspect ratio
    0.1,// Near
    10000 // Far
    );
    var geometry = new THREE.CylinderGeometry(2.5,2.5,0.5,nseg);
    //BoxGeometry( 5, 5, 5 );
    var material = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF
    });
    var selMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFF00
    });
    var hiMaterial = new THREE.MeshPhongMaterial({
        color: 0xFF0000
    });
    //mesh.rotation.y += (pi2/nseg)*0.5
    var body = new THREE.Object3D();
    camera.position.set(0, 0, 32);
    //(-15, 10, 15);
    //camera.lookAt(scene.position);
    var camYaw = new THREE.Object3D();
    var camPitch = new THREE.Object3D();
    camPitch.rotation.x = pi2 * 0.85;
    body.add(camYaw);
    camYaw.add(camPitch);
    camPitch.add(camera);
    //body.rotation.x = Math.PI;
    scene.add(body);

    var bones = [];
    var boneMeshes=[];
    var jointsByMeshId = {};
    
    var meshDB = {};
    function makeMesh(name,x,y,z,rx,ry,rz,s){
        var mesh = meshDB[name].clone();
        mesh.position.set(x?x:0,y?y:0,z?z:0)
        mesh.rotation.set(rx?rx:0,ry?ry:0,rz?rz:0,'XYZ');
        s=s?s:1.0
        mesh.scale.set(s,s,s);
        return mesh;
    }

    function seg(ang, rad) {
        var joint = new THREE.Object3D();
        var joint1 = new THREE.Object3D();
        var shoulder = new THREE.Object3D();
        var material = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF
        });
        var deg180 = Math.PI;
        var deg90 = Math.PI*0.5;
        var geometry = new THREE.BoxGeometry(1,1,2);
        var mesh = makeMesh("servoSleeveWithMultiConnectors",0,0,0,0,0,0,0.075);//new THREE.Mesh(geometry,material);
        var foot = makeMesh("foot",0.15,0,2.4,0,0,Math.PI*0.5,0.075);//new THREE.Mesh(geometry,material);
        var arm0 = makeMesh("servoArm",0.4,-0.45,-0.5,-deg90,-deg90,0,0.075);//new THREE.Mesh(geometry,material);
        var arm1 = makeMesh("servoArm",-0.5,-0.3,-0.3,-deg90,0,0,0.075);//new THREE.Mesh(geometry,material);
        var mesh1 = mesh.clone();//new THREE.Mesh(geometry,material);
 //       mesh.castShadow = true;
 //       mesh1.castShadow = true;

        var strut = makeMesh("quadStrut",0,0,-4,deg90,0,-deg90*0.5,0.075)

        mesh1.bone = arm0.bone = bones.length;
        
        //mesh1.bone = bones.length+1;
        arm1.bone = foot.bone = bones.length+1;
        
        shoulder.position.x = Math.sin(ang) * rad * 0.5;
        shoulder.position.z = Math.cos(ang) * rad * 0.5;
        shoulder.rotation.y = ang;

        body.add(shoulder);
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

        mesh.rotation.z=Math.PI*0.5
        
        for(var i=0;i<boneMeshes.length;i++)boneMeshes[i].userData.material = boneMeshes[i].material;


        mesh.position.z += -0.6;
        mesh1.position.z += 1.5;
        joint.position.z += 1.0;
        joint1.position.z += 2.8;


        var joint = jointsByMeshId[mesh1.id] = jointsByMeshId[arm0.id] = {
            axis: 'y',
            joint: joint,
            value: 0
        }
        bones.push(joint);
        joint = jointsByMeshId[foot.id] = jointsByMeshId[arm1.id] = {
            axis: 'x',
            joint: joint1,
            value: 0
        }
        bones.push(joint)

		//			shoulder.add( new THREE.BoxHelper( mesh ) );
    }

    var light = new THREE.SpotLight(0xFFFFFF);
    //var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 20, 0);
    light.penumbra = 0.5;
    light.decay = 0.1;
    scene.add(light);

    //light0.lookAt(scene);
    //light0.castShadow = 
    light.lookAt(scene);
    light.castShadow = true;
	

 //   var light0 = new THREE.AmbientLight(0x606060);
 //   light0.position.set(-9, 7, 9);
//    scene.add(light0);

        var light0 = new THREE.DirectionalLight(0xffffff);
        light0.position.set(-9, 7, 9);
        scene.add(light0);
        light0.lookAt(scene);

//    light0.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 50, 1, 1200, 2500 ) );
//    light0.shadow.bias = 0.0001;

    light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

//scene.add(new THREE.CameraHelper( light.shadow.camera ))

    renderer.setClearColor(0x303030, 1);//0x8d8ddd
    var mouse = new THREE.Vector2();
    
    function onMouseMove(event) {
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener('mousemove', onMouseMove, false);
    
// Configure min and max servo pulse lengths
var servoMin = 150  // Min pulse length out of 4096
var servoMax = 600  // Max pulse length out of 4096
var servoMid = ((servoMin+servoMax)/2)|0
var servoRng = servoMax-servoMin;

    var jointRangeRadians = Math.PI * 0.5;

    
    function setBone(i,bval){
        var bone = bones[i];
        bone.value = bval;
        bone.value = bone.value < -1 ? -1 : bone.value > 1 ? 1 : bone.value;
        var ang = bone.value * jointRangeRadians;
        bone.joint.rotation[bone.axis] = ang;

        var npwm = (servoMid+(servoRng*bone.value*0.5))|0;
        if(bone.pwm==undefined)bone.pwm = npwm;

        if(npwm != bone.pwm){
            bone.pwm=npwm;
            send({
                c: i,
                v: bone.pwm
            });
        }
       
    }

    function angleChanged(evt) {
        if (selectedBone) {
            var bval = ((angleSlider.value | 0) / 50) - 1;
            var ang = selectedBone.value * jointRangeRadians;
            if (allCheckbox.checked == true) {
                var ax = selectedBone.axis;
                for (var i = 0; i < bones.length; i++)
                    if (bones[i].axis == ax) {
                        setBone(i,bval);
                    }
            } else {
                setBone(bones.indexOf(selectedBone),bval);
            }
        }
    }
    var hilightedMesh;
    var selectedMesh;
    var selectedBone;
    var bgClicked;
    var buttons = 0;
    function mdown(event) {
        if(event.target!=canv)return;
        buttons |= 1 << event.button;
        if (hilightedMesh && (hilightedMesh.bone!=undefined)) {
            if(hilightedMesh != selectedMesh)
            {
                if (selectedMesh)
                    selectedMesh.material = selectedMesh.userData.material;
                selectedMesh = hilightedMesh;
                selectedMesh.material = selMaterial;
                selectedBone = jointsByMeshId[selectedMesh.id];
                if (selectedBone) {
                    this.angleSlider.value = (selectedBone.value + 1) * 50;
                }
            }
            
        } else {
            if (buttons != 0)
                bgClicked = true;
        }
    }
    function mup(event) {
        if(event.target != canv)return;
        buttons &= ~(1 << event.button);
        bgClicked = false;
        send({
            stop: true
        });
        hilightedMesh = undefined;
        event.preventDefault();
        return false;
    }
    function mmove(evt) {
        if (bgClicked) {
            camYaw.rotation.y += evt.movementX * 0.01;
            camPitch.rotation.x += evt.movementY * 0.01;
        } else if (selectedBone != undefined && buttons == 1) {
            var bval = selectedBone.value + (selectedBone.axis=='y'?evt.movementX:evt.movementY) * 0.01;
            setBone(bones.indexOf(selectedBone),bval);
        }
    }



        var groundMat = new THREE.MeshPhongMaterial( { color: 0x228033, specular: 0x111111, shininess: 50 } );
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(150,150,5,5),groundMat);
    ground.rotation.x = Math.PI*1.5;
    ground.position.y-=4;
    ground.castShadow = false;
    ground.receiveShadow = true;
    scene.add(ground);


    var loader = new THREE.STLLoader();
    var activeMeshLoads=0;

    function meshLoaded(geometry,id){
        var material = new THREE.MeshPhongMaterial( { color: 0xff5533, specular: 0x111111, shininess: 200 } );
        var mesh = new THREE.Mesh( geometry, material );
        //mesh.position.set( 0, - 0.25, 0.6 );
        //mesh.rotation.set( 0, - Math.PI / 2, 0 );
        mesh.scale.set( 0.1, 0.1, 0.1 );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        //scene.add( mesh );
        meshDB[id]=mesh;
        activeMeshLoads--;
    }

    function loadMeshSTL(path,id){
        activeMeshLoads++;
        loader.load( path, function(_id){var id = _id;return function(geometry){meshLoaded(geometry,id)}}(id));
    }
    var stlparts=["foot","quadStrut","servoArm","servoSleeveWithMultiConnectors"];
    for(var i=0;i<stlparts.length;i++)loadMeshSTL('./design/'+stlparts[i]+'.stl',stlparts[i]);
    var botBuilt = false;
    function buildBot(){
        
/*
        var mesh = new THREE.Mesh(geometry,material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        body.add(mesh);
*/

        for (var i = 0; i < nseg; i++)
            seg(((pi2 / nseg) * i) + (pi2 / 8), 8);

        angleSlider.oninput = angleChanged;
        window.addEventListener('mousedown', mdown, false);
        window.addEventListener('mouseup', mup, false);
        window.addEventListener('mouseout', mup, false);
        window.addEventListener('mousemove', mmove, false);
        botBuilt=true;
    }
    var hilightedMesh;
    var selectedMesh;
    function render() {
        if(!botBuilt&&activeMeshLoads==0){
            buildBot();
        }
        requestAnimationFrame(render);
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        // update the picking ray with the camera and mouse position	
        raycaster.setFromCamera(mouse, camera);
        // calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects(boneMeshes, true);

        if (intersects.length > 0) {
            if (hilightedMesh &&  hilightedMesh != selectedMesh) {
                hilightedMesh.material = hilightedMesh.userData.material;
                hilightedMesh = undefined;
            }

            hilightedMesh = intersects[0].object;
            if (hilightedMesh.bone!=undefined && hilightedMesh != selectedMesh){
                hilightedMesh.material = hiMaterial;
            }
        }
        renderer.render(scene, camera);
        //body.rotation.y += 0.001;
    }
    requestAnimationFrame(render);
}
