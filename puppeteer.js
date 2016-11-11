
function start(){
	var renderer = new THREE.WebGLRenderer({canvas:canv});
    renderer.setSize( 800, 640 );
    var scene = new THREE.Scene();

      var camera = new THREE.PerspectiveCamera(
        35,         // Field of view
        800 / 640,  // Aspect ratio
        0.1,        // Near
        10000       // Far
    );
    camera.position.set( -15, 10, 15 );
    camera.lookAt( scene.position );

    var geometry = new THREE.CylinderGeometry(2.5,2.5,0.5,4);//BoxGeometry( 5, 5, 5 );
    var material = new THREE.MeshPhongMaterial( { color: 0xFFFFFF } );
    var body = new THREE.Mesh( geometry, material );
    scene.add( body );


	var bones=[];
	function seg(ang,rad){
		var joint = new THREE.Object3D();
	    var joint1 = new THREE.Object3D();
	    var joint2 = new THREE.Object3D();
	    var joint3 = new THREE.Object3D();
	    var geometry = new THREE.BoxGeometry( 1, 1, 2 );
    	var material = new THREE.MeshPhongMaterial( { color: 0xFFFFFF } );
    	var mesh = new THREE.Mesh( geometry, material );
    	var mesh1 = new THREE.Mesh( geometry, material );

    	joint.position.x=Math.sin(ang)*rad;
    	joint.position.z=Math.cos(ang)*rad;

    	body.add( joint );
	    
	    joint1.rotation.y=ang;
//    	joint1.position.z = 2;
	    joint.add( joint1 );

	    joint1.add( mesh );

		joint1.add(joint2);
		joint2.position.z+=2;
		joint2.add(joint3);
		joint3.position.z+=1;
		joint3.add(mesh1)

	}
	var pi2 = Math.PI*2;
	
	var nseg = 4;
	for(var i=0;i<nseg;i++)
		seg(((pi2/nseg)*i)+(pi2/8),4);

    var light = new THREE.PointLight( 0xFFFFFF );
    light.position.set( 10, 10, 10 );
    scene.add( light );

    var light = new THREE.PointLight( 0xFFFFFF );
    light.position.set( -10, 4, 20 );
    scene.add( light );


     renderer.setClearColor( 0xdddddd, 1);

     function render(){
	     requestAnimationFrame(render);
	     renderer.render( scene, camera );
	     body.rotation.y+=0.01;
     }


     requestAnimationFrame(render);
}