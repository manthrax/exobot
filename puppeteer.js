function start() {
    var connection = new WebSocket('ws://' + location.host ,['soap', 'xmpp']);
    // When the connection is open, send some data to the server
    var connected = true;
    connection.onopen = function() {
        //connection.send('Ping');
        // Send the message 'Ping' to the server
        connected = true;
    }
    
    // Log errors
    connection.onerror = function(error) {
        console.log('WebSocket Error ' + error);
    }
    
    // Log messages from the server
    connection.onmessage = function(e) {
        console.log('Server: ' + e.data);
    }
    function send(obj){
        if(connected){
            connection.send(JSON.stringify(obj));
        }
    }
    stopButton.onclick = function(e){
        send({stop:true});
    }
    
    resetButton.onclick = function(e){
        send({restartServer:true});
        setTimeout(function(){location.reload();},5000);
    }
    
    var renderer = new THREE.WebGLRenderer({
        canvas: canv
    });
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
    var mesh = new THREE.Mesh(geometry,material);
    //mesh.rotation.y += (pi2/nseg)*0.5
    var body = new THREE.Object3D();

    var pos = new THREE.Vector3(0,0,15);
    camera.position.set(0,0,15);//(-15, 10, 15);
    //camera.lookAt(scene.position);

    var camYaw = new THREE.Object3D();
    var camPitch = new THREE.Object3D();

    camPitch.rotation.x = pi2*0.85;

    body.add(camYaw);
    camYaw.add(camPitch);
    camPitch.add(camera);

    //body.rotation.x = Math.PI;
    
    scene.add(body);
    body.add(mesh);
    var bones = [];
    var jointsByMeshId = {};
    function seg(ang, rad) {
        var joint = new THREE.Object3D();
        var joint1 = new THREE.Object3D();
        var shoulder = new THREE.Object3D();
        var geometry = new THREE.BoxGeometry(1,1,2);
        var material = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF
        });
        var mesh = new THREE.Mesh(geometry,material);
        var mesh1 = new THREE.Mesh(geometry,material);
        shoulder.position.x = Math.sin(ang) * rad * 0.5;
        shoulder.position.z = Math.cos(ang) * rad * 0.5;
        shoulder.rotation.y = ang;
        body.add(shoulder);
        shoulder.add(joint);
        joint.add(joint1);
        joint.add(mesh);
        joint1.add(mesh1)
        mesh.position.z += 1.0;
        mesh1.position.z += 1.0;
        joint1.position.z += 2.5;
        bones.push(jointsByMeshId[mesh.id] = {
            axis: 'y',
            joint: joint,
            value: 0
        });
        bones.push(jointsByMeshId[mesh1.id] = {
            axis: 'x',
            joint: joint1,
            value: 0
        });
    }
    for (var i = 0; i < nseg; i++)
        seg(((pi2 / nseg) * i) + (pi2 / 8), 4);
    var light = new THREE.PointLight(0xFFFFFF);
    light.position.set(10, 10, 10);
    scene.add(light);
    var light = new THREE.PointLight(0xFFFFFF);
    light.position.set(-10, 4, 20);
    scene.add(light);
    renderer.setClearColor(0xdddddd, 1);
    var mouse = new THREE.Vector2();
    function onMouseMove(event) {
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener('mousemove', onMouseMove, false);
    var jointRangeRadians = Math.PI * 0.5;
    angleSlider.oninput = function(evt) {
        if (selectedBone) {
            var bval = ((angleSlider.value | 0) / 50) - 1;
            var ang = selectedBone.value * jointRangeRadians;
            if (allCheckbox.checked == true) {
                var ax = selectedBone.axis;
                for (var i = 0; i < bones.length; i++)
                    if (bones[i].axis == ax) {
                        bones[i].value = bval;
                        bones[i].joint.rotation[ax] = ang;

                        send({c:i,v:bval});
                        
                    }
            } else {
                selectedBone.value = bval;
                selectedBone.joint.rotation[selectedBone.axis] = ang;

                send({c:bones.indexOf(selectedBone),v:bval});

            }
        }
    }
    var lastHit;
    var selectedMesh;
    var selectedBone;
    var bgClicked;
    var buttons = 0;
    function mdown(event) {
        buttons |= 1<<event.button;
        if (lastHit) {
            if (lastHit != selectedMesh) {
                if (selectedMesh)
                    selectedMesh.material = material;
                selectedMesh = lastHit;
                selectedMesh.material = selMaterial;
                selectedBone = jointsByMeshId[selectedMesh.id];
                if (selectedBone) {
                    this.angleSlider.value = (selectedBone.value + 1) * 50;
                }
            }
        } else {
            if(buttons!=0)
                bgClicked = true;
        }
    }
    function mup(event) {
        buttons &= ~(1<<event.button);
        bgClicked = false;
        send({stop:true});
        //event.preventDefault();
        //return true;
    }
    function mmove(evt) {

        if(bgClicked){
            camYaw.rotation.y+=evt.movementX*0.001;
            camPitch.rotation.x+=evt.movementY*0.001;
        }else if(selectedBone!=undefined){
           
            selectedBone.value += evt.movementX*0.001;
            selectedBone.value = selectedBone.value<-1?-1:selectedBone.value>1?1:selectedBone.value;

            var ang = selectedBone.value * jointRangeRadians;
                
            selectedBone.joint.rotation[selectedBone.axis] = ang;
            send({c:bones.indexOf(selectedBone),v:selectedBone.value});
        }

    }
    window.addEventListener('mousedown', mdown, false);
    window.addEventListener('mouseup', mup, false);
    window.addEventListener('mousemove', mmove, false);
    function render() {
        requestAnimationFrame(render);
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        // update the picking ray with the camera and mouse position	
        raycaster.setFromCamera(mouse, camera);
        // calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects(scene.children, true);
        if (lastHit && lastHit != selectedMesh) {
            lastHit.material = material;
            lastHit = undefined;
        }
        if (intersects.length > 0) {
            lastHit = intersects[0].object;
            if (lastHit != selectedMesh)
                lastHit.material = hiMaterial;
        }
        renderer.render(scene, camera);
        //body.rotation.y += 0.001;
    }
    requestAnimationFrame(render);
}
