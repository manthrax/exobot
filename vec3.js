
function vec3(x,y,z){this.x = x?x:0;this.y = y?y:0;this.z = z?z:0;return this;}
vec3.prototype.set = function(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
vec3.prototype.copy = function(vb){this.x=vb.x;this.y=vb.y;this.z=vb.z;return this;}
vec3.prototype.add = function(vb){this.x+=vb.x;this.y+=vb.y;this.z+=vb.z;return this;}
vec3.prototype.sub = function(vb){this.x-=vb.x;this.y-=vb.y;this.z-=vb.z;return this;}
vec3.prototype.mul = function(vb){this.x*=vb;  this.y*=vb;  this.z*=vb;  return this;}
vec3.prototype.div = function(vb){this.x/=vb;  this.y/=vb;  this.z/=vb;  return this;}
vec3.prototype.dot = function(vb){return (this.x*vb.x)+(this.y*vb.y)+(this.z*vb.z);}
vec3.prototype.cross = function(vb,out){out=out?out:new vec3();return out.set(this.y*vb.z-this.z*vb.y,this.z*vb.x-this.x*vb.z,this.x*vb.y-this.y*vb.x)}
vec3.prototype.len2 = function(){return this.x*this.x+this.y*this.y+this.z*this.z;}
vec3.prototype.len = function(){return Math.sqrt(this.len2());}
vec3.prototype.normalize = function(){return this.div(this.len());}
