function App() {
    var SHADOW_MAP_WIDTH = 2048
      , SHADOW_MAP_HEIGHT = 2048;
    var renderer = new THREE.WebGLRenderer({
        canvas: canv,
        //shadowMapEnabled: true
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.soft = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    var raycaster = new THREE.Raycaster();
    renderer.setSize(window.innerWidth, window.innerHeight);
    var scene = this.scene = new THREE.Scene();
    var pi2 = this.pi2 = Math.PI * 2;
    var camera = this.camera = new THREE.PerspectiveCamera(35,// Field of view
    window.innerWidth / window.innerHeight,// Aspect ratio
    0.1,// Near
    10000 // Far
    );
    var hilightedMesh;
    var selectedMesh;
    var bgClicked;
    var buttons = 0;
    this.getSelectedMesh = function() {
        return selectedMesh;
    }
    window.stopButton.onclick = function(e) {
        puppeteer.send({
            stop: true
        });
    }
    window.exportButton.onclick = function(e) {
        puppeteer.exportModel();
    }
    window.restartButton.onclick = function(e) {
        puppeteer.send({
            restartServer: true
        });
        setTimeout(function() {
            location.reload();
        }, 5000);
    }
    window.killButton.onclick = function(e) {
        puppeteer.send({
            killServer: true
        });
        setTimeout(function() {
            location.reload();
        }, 5000);
    }
    window.dumpButton.onclick = function(e) {
        puppeteer.app.getJSON('bot-burn.json', function(err, data) {
            if (err != null ) {
                alert("Something went wrong: " + err);
            } else {
                console.log("Bot read.");
                App.prototype.setPrefs(data);
                Pane.syncAllStates();
            }
        })
    }
    window.burnButton.onclick = function(e) {
        puppeteer.send({
            burnToBot: {
                path: "bot-burn.json",
                data: JSON.stringify(puppeteer.app.getState())
            }
        });
    }
    function loadFileObjAsText(fileobj, loadedcb) {
        var reader = new FileReader();
        reader.onload = function(event) {
            var data = event.target.result;
            loadedcb(fileobj, data);
        }
        reader.readAsText(fileobj);
    }
    function handleFileSelect(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        var files = evt.dataTransfer.files;
        for (var i = 0, f; (f = files[i]) ; i++) {
            loadFileObjAsText(f, function(fileobj, txt) {
                //puppeteer.importModel(JSON.parse(txt));
                App.prototype.setPrefs(JSON.parse(txt));
                Pane.syncAllStates();
            })
        }
    }
    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'link';
        // Explicitly show this is a copy.
    }
    document.addEventListener('dragover', handleDragOver, false);
    document.addEventListener('drop', handleFileSelect, false);
    var prefs = this.getPrefs();
    var camYaw = this.camYaw = new THREE.Object3D();
    var camPitch = this.camPitch = new THREE.Object3D();
    camPitch.rotation.x = prefs.camera.pitch ? prefs.camera.pitch : pi2 * 0.85;
    camYaw.rotation.y = prefs.camera.yaw ? prefs.camera.yaw : pi2 * 0.85;
    camera.position.set(0, 0, prefs.camera.zoom ? prefs.camera.zoom : 32);
    scene.add(camYaw);
    camYaw.add(camPitch);
    camPitch.add(camera);
    function showStatus(str) {
        console.log(str);
        statusText.innerHTML = str;
    }
    var ud = picklet.create('uiDiv', 64, function(str, col) {
        puppeteer.colorSelected(str, col);
    }, [1, 1, 1]);
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
    var light0 = new THREE.AmbientLight(0x808080);
    scene.add(light0);
    /*
    var light0 = new THREE.DirectionalLight(0xffffff);
    light0.position.set(-9, 7, 9);
    scene.add(light0);
    light0.lookAt(scene);
*/
    //    light0.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 50, 1, 1200, 2500 ) );
    //    light0.shadow.bias = 0.0001;
    light.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    light.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    //scene.add(new THREE.CameraHelper( light.shadow.camera ))
    renderer.setClearColor(0x303030, 1);
    //0x8d8ddd
    var mouse = new THREE.Vector2();
    function onMouseMove(event) {
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener('mousemove', onMouseMove, false);
    var loader = new THREE.STLLoader();
    var activeMeshLoads = 0;
    var loadsFinished = false;
    function meshLoaded(geometry, id) {
        function v3(x, y, z) {
            return new vec3(x,y,z);
        }
        var mesh = new THREE.Mesh(geometry,material);
        //mesh.position.set( 0, - 0.25, 0.6 );
        //mesh.rotation.set( 0, - Math.PI / 2, 0 );
        mesh.scale.set(0.1, 0.1, 0.1);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        //scene.add( mesh );
        meshDB[id] = mesh;
        activeMeshLoads--;
    }
    this.getJSON = function(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("get", url, true);
        xhr.responseType = "json";
        xhr.onload = function() {
            var status = xhr.status;
            if (status == 200) {
                callback(null , xhr.response);
            } else {
                callback(status);
            }
        }
        ;
        xhr.send();
    }
    ;
    this.loadMeshSTL = function(path, id) {
        activeMeshLoads++;
        loader.load(path, function(_id) {
            var id = _id;
            return function(geometry) {
                meshLoaded(geometry, id)
            }
        }(id));
    }
    var hilightedMesh;
    var selectedMesh;
    var hilightMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(1,1,1,0.5),
        transparent: true,
        opacity: 0.5
    });
    var selectMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(1,1,1,0.25),
        transparent: true,
        opacity: 0.5
    });
    var selectGhost;
    var hilightGhost;
    var material = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF
    });
    var selMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFF00
    });
    var hiMaterial = new THREE.MeshPhongMaterial({
        color: 0xFF0000
    });
    function mwheel(evt) {
        camera.position.z += evt.wheelDelta * -0.01;
    }
    function mdown(event) {
        if (event.target != canv){
            //event.preventDefault();
            return;//s true;
        }
        buttons |= 1 << event.button;
        if (hilightedMesh) {
            if (hilightedMesh != selectedMesh) {
                if (selectedMesh) {
                    selectGhost.parent.remove(selectGhost);
                    selectedMesh = selectGhost = undefined;
                }
                selectedMesh = hilightedMesh;
                selectGhost = selectedMesh.clone();
                selectGhost.material = selectMaterial;
                selectGhost.scale.multiplyScalar(1.0);
                selectedMesh.parent.add(selectGhost);
                puppeteer.doSelectMesh(selectedMesh);
            }
        } else {
            if (selectedMesh) {
                selectGhost.parent.remove(selectGhost);
                selectedMesh = selectGhost = undefined;
            }
            if (buttons != 0)
                bgClicked = true;
        }
    }
    function mup(event) {
        if (event.target != canv)
            return;
        buttons &= ~(1 << event.button);
        bgClicked = false;
        puppeteer.send({
            stop: true
        });
        event.preventDefault();
        return false;
    }
    function mmove(evt) {
        if (bgClicked) {
            camYaw.rotation.y += evt.movementX * 0.01;
            camPitch.rotation.x += evt.movementY * 0.01;
        } else
            puppeteer.meshMoved(evt, buttons);
    }
    var pickables = this.pickables = [];
    var meshDB = this.meshDB = {};
    function getState() {
        var prefs = App.prototype.getPrefs();
        prefs.colors = {};
        scene.traverse(function(mesh) {
            if (mesh.userData.material) {
                var col = mesh.material.color;
                prefs.colors[mesh.id] = [col.r, col.g, col.b];
            }
        })
        prefs.camera.yaw = camYaw.rotation.y;
        prefs.camera.pitch = camPitch.rotation.x;
        prefs.camera.zoom = camera.position.z;
        puppeteer.saveState(prefs);
        return prefs;
    }
    this.getState = getState;
    function saveState() {
        localStorage.exobot = JSON.stringify(getState());
        return null ;
    }
    this.saveState = saveState;
    function render() {
        if (!loadsFinished && activeMeshLoads == 0) {
            loadsFinished = true;
            window.puppeteer.buildBot();
            Pane.syncAllStates();
            document.body.oncontextmenu=function(evt){return false;};
            window.addEventListener('mousedown', mdown, false);
            window.addEventListener('mouseup', mup, false);
            window.addEventListener('mouseout', mup, false);
            window.addEventListener('mousemove', mmove, false);
            window.addEventListener('mousewheel', mwheel, false);
        }
        requestAnimationFrame(render);
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        // update the picking ray with the camera and mouse position	
        raycaster.setFromCamera(mouse, camera);
        // calculate objects intersecting the picking ray
        var intersects = raycaster.intersectObjects(pickables, true);
        if (intersects.length > 0) {
            if (hilightedMesh != intersects[0].object) {
                if (hilightGhost) {
                    hilightGhost.parent.remove(hilightGhost);
                    hilightGhost = undefined;
                }
                hilightedMesh = intersects[0].object
                hilightGhost = hilightedMesh.clone();
                hilightGhost.scale.multiplyScalar(1.0);
                hilightGhost.material = hilightMaterial;
                hilightedMesh.parent.add(hilightGhost);
            }
        } else {
            hilightedMesh = undefined;
            if (hilightGhost) {
                hilightGhost.parent.remove(hilightGhost);
                hilightGhost = undefined;
            }
        }
        renderer.render(scene, camera);
        puppeteer.tick();
        //body.rotation.y += 0.001;
    }
    requestAnimationFrame(render);
    window.onbeforeunload = function(e) {
        saveState();
        return;
        // "Haaaalps!"
    }
}
App.prototype.setPrefs = function(prefs) {
    App.prefs = prefs;
}
App.prototype.getPrefs = function() {
    if (App.prefs)
        return App.prefs;
    var prefs = App.prefs = {}
    try {
        App.prefs = prefs = JSON.parse(localStorage.exobot);
    } catch (err) {
        App.prefs = prefs = {};
    }
    if (!prefs.camera)
        prefs.camera = {};
    if (!prefs.colors)
        prefs.colors = {};
    if (!prefs.bones)
        prefs.bones = {};
    return prefs;
}
