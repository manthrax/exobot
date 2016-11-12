function start() {
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
    camera.position.set(-15, 10, 15);
    camera.lookAt(scene.position);
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
    var jointRangeRadians = Math.PI * 0.45;
    angleSlider.oninput = function(evt) {
        if (selectedBone) {
            var bval = ((angleSlider.value | 0) / 50) - 1;
            var ang = selectedBone.value * jointRangeRadians;
            if(allCheckbox.checked == true){
                var ax = selectedBone.axis;
                for(var i=0;i<bones.length;i++)if(bones[i].axis==ax){
                    bones[i].value = bval;
                    bones[i].joint.rotation[ax] = ang;
                }
            }else{
                selectedBone.value =bval;
                selectedBone.joint.rotation[selectedBone.axis] = ang;
            }
        }
    }
    var lastHit;
    var selectedMesh;
    var selectedBone;
    var bgClicked;
    function mdown(event) {
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
            //} if(event.target==canv){
            bgClicked = true;
        }
    }
    function mup(event) {bgClicked = false;}
    function mmove(evt) {
    }
    window.addEventListener('mousedown', mdown, false);
//    window.addEventListener('mouseup', mup, false);
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
        if(intersects.length>0){
            lastHit = intersects[0].object;
            if (lastHit != selectedMesh)
                lastHit.material = hiMaterial;
        }
        renderer.render(scene, camera);
        body.rotation.y += 0.001;
    }
    requestAnimationFrame(render);
}