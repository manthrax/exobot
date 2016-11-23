
var tv30 = new vec3();
var tv31 = new vec3();
var TIMESTEP = 1.0/60;
var INVERSE_TIMESTEP = 1.0/TIMESTEP;


function PointMass(pos,mass,drawProxy){
	this.position = new vec3().copy(pos);
	this.velocity = new vec3();
	this.impulse = new vec3();
	this.invMass = 1.0/mass;
	this.drawProxy = drawProxy;
}

PointMass.prototype.update = function(){
	this.velocity.add(tv30.copy(this.impulse).mul(this.invMass));
	this.velocity.y -= 0.098;

	this.position.add(tv30.copy(this.velocity).mul(TIMESTEP));
	
	if(this.position.y<0.0){
		this.position.y=-this.position.y;
		this.velocity.y=-this.velocity.y;
	}

	this.drawProxy.position.copy(this.position);
	this.impulse.set(0,0,0);
}



function Spring(massA,massB){
	this.STIFFNESS = 1.0/5;
	this.DAMPING = 0.001;
	var uv = this.unitVector = new vec3();
	this.restLength = uv.copy(massB.position).sub(massA.position).len();
	this.reducedMass = 1.0 / (massA.invMass + massB.invMass);
	this.particleA = massA;
	this.particleB = massB;
}

Spring.prototype.computeImpulse = function(){
	var deltaP = tv30.copy(this.particleB.position).sub(this.particleA.position);
	var deltaV = tv31.copy(this.particleB.velocity).sub(this.particleA.velocity);
	this.unitVector.copy(deltaP).normalize();
	var pErr = this.unitVector.dot(deltaP)-this.restLength;
	var vErr = this.unitVector.dot(deltaV);
	var pImpulse = this.STIFFNESS * pErr * INVERSE_TIMESTEP;
	var vImpulse = this.DAMPING * vErr;
	var impulse = -(pImpulse*vImpulse)*this.reducedMass;
	var adjust = tv30.copy(this.unitVector).mul(impulse);
	this.particleA.impulse.sub(adjust);
	this.particleB.impulse.add(adjust);
}

function SMWorld(world){
	this.springs = [];
	this.masses = [];
	this.gravity = new vec3(0,0.98,0);


    function v3(x, y, z) {
        return new vec3(x,y,z);
    }
    var material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        specular: 0x111111,
        shininess: 100
    });
    var ballGeom = new THREE.SphereGeometry(1,16,8);
    var ballMesh = new THREE.Mesh(ballGeom,material);
    ballMesh.castShadow = ballMesh.receiveShadow = true;
    function ball() {
        var m = ballMesh.clone();
        world.scene.add(m);
        return m;
    }
    var pts = [
    v3(-5, -5, -5), v3(5, -5, -5), v3( 5, 5, -5), v3(-5, 5, -5),
    v3(-5, -5,  5), v3(5, -5,  5), v3( 5, 5,  5), v3(-5, 5,  5), ];
    var tv30 = v3().set(0, -10, 0);
    for (var len = pts.length, i = 0; i < len; i++)
        pts[i] = this.makePointMass(pts[i].add(tv30), 1.0, ball());
    var links = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 0, 0, 4, 1, 5, 2, 6, 3, 7,

    0,6, 1,7, 2,4, 3,5];
    for (var len = links.length, i = 0; i < len; i += 2)
        this.makeSpring(pts[links[i]], pts[links[i + 1]]);

	this.step();
	return this;
}

SMWorld.prototype.step = function(){
	for(var ct = this.springs.length,i=0;i<ct;i++)this.springs[i].computeImpulse();
	for(var ct = this.masses.length,i=0;i<ct;i++)this.masses[i].update();
}

SMWorld.prototype.makeSpring = function(massA,massB){
	var spr = new Spring(massA,massB);
	this.springs.push(spr);
	return spr;
}

SMWorld.prototype.makePointMass = function(pos,mass,drawProxy){
	var pm = new PointMass(pos,mass,drawProxy);
	this.masses.push(pm);
	return pm;
}
