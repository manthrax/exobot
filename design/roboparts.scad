// CSG-modules.scad - Basic usage of modules, if, color, $fs/$fa

// Change this to false to remove the helper geometry
debug = true;

// Global resolution
$fa = 5;    // Don't generate larger angles than 5 degrees
$fs = 0.2;  // Don't generate smaller facets than 0.1 mm
$fa = 10;    // Don't generate larger angles than 5 degrees

scaleFudge = 1.01;
roundCubes = true;

versionNo = "0.7";

//servoTabLength = 5;

wallThickness = 3;
//Radioshack 2730765
servoName = "RShack";
servoTabLength = 6;
servoBodyWidth = 12;
servoBodyHeight = 21;
servoTabThickness = 2.1;


//TowerPro SG-90
servoName = "TP-SG90";
servoTabLength = 8;//how far the tab sticks out
servoBodyWidth = 13.1;
servoBodyHeight = 23;
servoTabThickness = 2.58;



// Main geometry

//Render the part
partsOnly = true ;
legInset = 32;
nside = 4;  //Number of legs 6 = hexapod
segAngle = 360/nside;

baseRadius = 75;//54;

hardwareZOffset = -1;

piVerticalOffset = 8.5;
battVerticalOffset = -18;
buckVerticalOffset = 36.5;


br = baseRadius;
sa = segAngle;

//pp1 = [sin(0)*br,cos(0)*br,0];
//pp2 = [sin(sa)*br,cos(sa)*br,0];


function rvec(x,y,a) = [(sin(a)*x)+(cos(a)*y),(-cos(a)*x)+(sin(a)*y),0]; 

bo =   14;
pp1 = rvec(br,bo,0);
pp2 = rvec(br,-bo,sa);

chordRadius = norm((pp1+pp2)*0.5);
chordLength =  norm(pp2-pp1);



color0 = "Teal";//"LightGreen";
color1 = "LightBlue";
color2 = "Red";
color3 = "Orange";

rackBeamWidth = 23;


npart = 80;//17;//80;//70;//17;//15;
doPart(npart);

module doPart(part){

    if(part==0){ color(color0) translate([6,0,5]) rotate([90,0,90])  servoArm(); }
    
    if(part==5){ color(color0) translate([6,0,5]) rotate([0,0,0])  m2m(); }
    
    if(part==10){ color(color1) rotate([0,90,0]) calfSleeve(); }
    if(part==15){ color(color3) rotate([0,90,0]) calfSleeveWithConnectors(); }
    if(part==17){ color(color3) rotate([0,90,0]) calfMultiConnectorSleeve();}
    if(part==20){ translate([0,0,-50]) rotate([0,90,90]) foot(); }
    if(part==30){ color(color2) bodyClamp(); }
    if(part==40){ rotate([0,0,0]) bodyFrame(); }

    if(part==50){ color(color3) translate([0,0,9.5]) rotate([0,-90,0]) sensorMount(); }
    if(part==60){ color(color0) translate([6,0,12.5]) rotate([0,-90,0]) servoCage(); }

    if(part==65){ rotate([0,0,segAngle/2]) strut(); }
    
    if(part==70){ leg(); }
    if(part==80){ bot(); }//bodyClamp();}
    if(part == 90){
        servoCage();
        servoArm();
        #servo();
        #servoHorn();
    //   translate([0,0,14.5]) cube([6,6,6]);
    //barProxy();
        translate([-32,0,-1]) rotate([0,90,0])  sensorMount();
    }
    
    if(part == 100){
        rotate([90,0,0])rackShelfClip();
    }
    if(part == 110){
        rackRaspi();
    }
    if(part == 120){
        rackBuck();
    }
    
    if(part == 125){
        rotate([90,0,0]){
          servoBoardSpacer();
          translate([0,0,11.7]) boardHolePin();
        }
    }
    if(part == 130){
        rackVis();
    }
}



///

//Battery: 100x30x20
//RASPI: 87x57x37
//Buck converter 66x36x13


module servoBoardSpacer(){
    cylinder(10.5,2.5,2.5,center = true);
    cylinder(20.5,1.25,1.25,center = true);
}

module boardHolePin(){
    cylinder(2.5,2.5,2.5,center = true);
    translate([0,0,3])cylinder(6,1.25,1.25,center = true);
}


module hcube(dim,center = false){
    difference(){
        cube(dim,center);
        cube([dim.x-4,dim.y-4,dim.z+2],center);
    }
}

module hardware(){
    module buckConverter(){
        #hcube([66,36,13],center = true);
        translate([0,0,-5.0])color("Red") cube([59.5,28.5,2],center = true);
    }
    
        translate([0,0,battVerticalOffset]) #hcube([100,30,20],center = true);//battery
        
        translate([0,0,piVerticalOffset]) #hcube([87,57,25],center = true);//pi
        translate([12,0,piVerticalOffset-11.5]) color("Red") cube([57.5,49,2],center = true);//pi57.5,49

        translate([0, 18.5,buckVerticalOffset+9])  buckConverter();
        translate([0,-18.5,buckVerticalOffset+9])  buckConverter();
    
}

module rackShelfArm(){
    r1 = chordRadius/2;
    translate([r1-5,0,0])cube([chordRadius-6,5,2],center=true);
    translate([chordRadius-9,0,1.5])cube([2,5,1],center=true);//Tongue
}

module rackShelfArms(){
    for(i=[0:1:nside])
    rotate([0,0,segAngle*i]){
        rackShelfArm();
    }    
}


module socket(slot = false){
    if(slot){
        connectorSlot();
    }else{
        rotate([180,0,0])connectorWithBase();
    }
}

module rackShelfClip(){
    r2 = chordRadius-7;
    r1 = chordRadius-4;
//    translate([0,0,-r1]) rotate([180,0,0]) connectorSlot();
    maskWid = 6;
    slotWid = maskWid-1;
    module slotMask(){
       for(i=[-1:1:0]){
            translate([0,0,(43*i)+22.5]){
                cube([20,maskWid ,2.1],center = true);
                translate([9,0,1.5])cube([2,maskWid,1],center=true);//Tongue
            }
       }
    }
    
    translate([r1,0,0]){
        translate([-1,0,0])rotate([0,90,0]) socket(false);
        translate([0,0,-hardwareZOffset]){
            difference(){
                translate([-5,0,1.5]) cube([6,slotWid,50],center=true);
                translate([-14,0,0]) slotMask();
                translate([-8,0,1.5]) cube([8,maskWid,36],center=true);
            }
           // translate([-14,0,0]) slotMask();
        }
    }
}

module rackPinBase(dx,dy){
    dx2 = dx/2;
    dy2 = dy/2;
        module rackPin(){
            //translate([0,0,-3.5]) cylinder(4,1.4,1.4,center = true);
            translate([0,0,-0.8]) cylinder(3.5,2.5,2.5,center = true);
        }
    rotate([0,90,0]){
        translate([0,dx2,dy2])rotate([0,90,0])rackPin();
        translate([0,-dx2,dy2])rotate([0,90,0])rackPin();
        translate([0,dx2,-dy2])rotate([0,90,0])rackPin();
        translate([0,-dx2,-dy2])rotate([0,90,0])rackPin();
    }
}

module rackPins(dx,dy){
    dx2 = dx/2;
    dy2 = dy/2;
        module rackPin(){
            translate([0,0,-1.5]) cylinder(8,1.4,1.4,center = true);
        }
    rotate([0,90,0]){
        translate([0,dx2,dy2])rotate([0,90,0])rackPin();
        translate([0,-dx2,dy2])rotate([0,90,0])rackPin();
        translate([0,dx2,-dy2])rotate([0,90,0])rackPin();
        translate([0,-dx2,-dy2])rotate([0,90,0])rackPin();
    }
}

module rackPlate(dx,dy){
    dx2 = dx/2;
    dy2 = dy/2;
    rotate([0,90,0])//difference()
    {
        difference()
        {
            cube([2,dx+4,dy+4],center = true);
            cube([4,dx-3,dy-3],center = true);
        }
    }
    rackPinBase(dx,dy);
}



module rackRaspi(){//57.5 49
    translate([0,0,piVerticalOffset-15]){
        rackShelfArms();
        translate([12,0,0]){
            difference(){
                rackPlate(49,57.5);
                rackPins(49,57.5);
            }
        }
    }
}


module rackBuck(){
    spacing = 8;
    
    translate([0,0,buckVerticalOffset]){
        difference(){
            translate([0,0,0]){
                rackPlate(28.5*2+spacing,59.5);//28.5 59.5   35, 66
                rackPinBase(spacing,59.5);
            }
            rackPins(28.5*2+spacing,59.5);
            rackPins(spacing,59.5);
        }
        
        rackShelfArms();
    }
}

module allRacks(){
    rackBuck();
    rackRaspi();
}


module rackVis(){
    
    rotate([0,0,segAngle/2]){
        translate([0,0,-(hardwareZOffset+14)]){
            allRacks();
             hardware();
        }
        for(i=[0:1:nside])
        rotate([0,0,segAngle*i])
            rackShelfClip();
    }
}


module bodyClamp(){
    difference()
    {
        color("Purple") translate([0,0,-4]) cylinder(7,33,33,$fn=6,center = true);
      //  basePunch();
        bot();
        bodyFrame();
    }
}

module basePunch(scl=1){
    module punch(){
        scale(1.0){
        translate([0,-50,0]) rotate([0,0,30]) cylinder(28,16*scl,16*scl,$fn=nside,center = true);
        rotate([0,0,30]) translate([24.5,14,0]) cylinder(18,13.5*scl,13.5*scl,$fn=nside,center = true);
        }
    }
    rotate([0,0,90]) punch();
    rotate([0,0,30]) punch();
    rotate([0,0,150]) punch();
    rotate([0,0,-90]) punch();
    rotate([0,0,-30]) punch();
    rotate([0,0,-150]) punch();
    rotate([0,0,0]) cylinder(28,15,15,$fn=nside,center = true);
}

module bodyFrame(){
    //difference()
    {
        /*
        color("Blue") translate([0,0,-2.5]){
            cylinder(5,48,48,$fn=6,center = true);
            translate([0,0,6]) cylinder(15,38,48,$fn=nside,center = true);
        }
        basePunch();
        */
        botLegs();
    }
}

module botLegs(){
    thet = 360/nside;
    for(i=[0:1:nside-1]){
        rotate([0,0,thet*i]) leg();
    }
}

module bot(){
    rackVis();

    bodyFrame();
    botLegs();
}

module calfSleeve(){
    difference()
    {
        translate([-11,0,0]) rotate([-90,0,0]){
            
            rcube([28,servoBodyHeight+3,servoBodyWidth+3],center = true,r=2);
        
            translate([-10,13,0]) rotate([0,90,90]) cylinder(2.5,4,4,$fn=32,center = true);  //axel sheath          
        }
        translate([1,0,0]) rotate([0,90,0]) trackSub();

        translate([-15,0,0]) servo();
      //  translate([26,0,0]) rotate([-90,180,180]) servo();
        
        translate([-11,0.1,0]) rotate([-90,0,0]){
            rotate([0,0,90]) translate([-10,6,(servoBodyWidth/2)+1.0]){
                //text("Thrax", size=5);
                translate([1,3,0]) linear_extrude(height = 1) { text(servoName, size=3); }
                translate([-0.5,-4,0]) linear_extrude(height = 1) { text("THRAX", size=4.5); }
                translate([14,-9,0]) linear_extrude(height = 1) { text(versionNo, size=3); }
            }
        }
        
    }
}

module cableGuide(){
        //Cable guide
    connOff = (servoBodyWidth/2)+wallThickness;
    translate([-1,-connOff-2.9,-4]) rotate([180,90,0]){
        translate([8,-1.5,6])cylinder(14,1,1,center = true);
        translate([0,-2.5,6]) cube([1,4,14],center = true);
        translate([4,-1,6]) cube([8,1,14],center = true);
    }
}


module calfSleeveWithConnectors(){
    calfSleeve();
    
    connOff = (servoBodyWidth/2)+wallThickness;
    translate([-7,connOff+0.4,2]) rotate([90,0,0]) connector();
    translate([-7,-connOff,2]) rotate([90,-90,0]) connectorSlot();
    
    cableGuide();
    
}


module calfMultiConnectorSleeve(){
    calfSleeveWithConnectors();


    connOff = (servoBodyHeight/2)+3.4;
    translate([-7,0,connOff]) rotate([0,-180,0]) connector();
    translate([-7,0,-connOff]) rotate([0,-180,180]) connectorSlot();
}

module footShape(){
    intersection()
    {
        res = 12;
        cube([28,10,24],center = true,r=1);
        translate([11,-95,0]) cylinder(50,100,100,center=true,$fn=res);
        translate([11,95,0]) cylinder(50,100,100,center=true,$fn=res);
        translate([9,0,0]) scale([24,6,12]) sphere($fn=res);
    }
}
module foot(){
    //Foot
    translate([-52,0,2]) rotate([0,0,0]){
        difference(){
            translate([-14,0,0]) scale([2,1,1]) footShape();
            translate([12,0,0]) rotate([90,0,90]) trackSub();            
        }
    }
}

module connectorBase(){
    cylinder(2.5,7,7,center=true,$fn = 8);
}

module connectorSlotWithWideBase(){ translate([-1,0,0]){ connectorSlot(); translate([0,0,-3.25]) connectorBase();}}

module connectorWithWideBase(){ connector(); translate([0,0,3.25]) connectorBase();}

module strut(){
    //strut
    strutLen = chordLength;//baseRadius/PI*2.5;
    tiltAng = 360/(nside*2);
   // rotate([0,0,-0.5*segAngle]) translate([-baseRadius+24,0,-2]){
    rotate([0,0,-0.5*segAngle]) translate([-chordRadius+1,0,-2]){
        translate([-1,0,0]) rcube([3,strutLen,15],center = true);
        translate([2.1,-strutLen*0.5,-1]) rotate([-90,0,tiltAng]) translate([0,-1,-1.5]) connectorWithWideBase();
        translate([2.1, strutLen*0.5,-1]) rotate([0,90,90-tiltAng]) translate([0,0,1.5]) connectorSlotWithWideBase();
        
        translate([3,0,0]) rotate([180,-90,0]) connectorSlotWithWideBase();
        translate([-5,0,1]) rotate([0,-90,0]) connectorSlotWithWideBase();
        
//        translate([1.1,-strutLen*0.475,0])  rotate([(360/8)-90,90,-90]) cylinder(2.5,7,7,center=true,$fn = 8);
//        translate([1.1, strutLen*0.485,0])  rotate([(360/8),90,-90]) cylinder(2.5,7,7,center=true,$fn = 8);
     }
}

module leg(){
    
    color(color1) strut();
    
    
    translate([-baseRadius-legInset,0,0]) rotate([90,0,0])
    {
        
        //difference()
        {
            color(color0) rotate([90,0,0]) translate([41,0,0]) calfMultiConnectorSleeve();
            //Thigh
            //translate([28,0,0]) rcube([24,24,15],center = true,r=1);
            color(color1) translate([26,0,0]) rotate([90,0,0]) servoArm();
            if(!partsOnly)color(color3) translate([26,0,0]) rotate([-90,180,180]) servo();

            translate([0,-2,-2]){
                
                //Calf
                color(color0) calfSleeveWithConnectors();
                translate([-15,0,0]) rotate([0,0,0])color(color1) servoArm();
                //translate([1,0,0]) rotate([0,90,0])connectorSlot();
                if(!partsOnly)translate([-15,0,0])servo();
                
                color(color0) foot();
                
            }
        }
    }
}



//camPlate();

module sensorMount(){
    module subMask(){
        module cyl(){
            translate([-3,0,-10]){ 
                rotate([0,0,45]) cylinder(3,32.5,29,$fn=4,center = true);
                translate([0,0,-2.5]) cube([14,46,2.5],center = true);
            }
        }
        cyl();
        translate([0,0,8]) cyl();
        camPlate();
    }
    difference(){
        translate([-3,0,-3]) rcube([13,49,17],r=1,center = true);
        subMask();
    }
    translate([-3,0,7])connectorSlot();
}

module camPlate(){
   cube([60,46,2],center = true);
   translate([0,0,-2]) cube([40,42,10.5],center = true);
   translate([0,0,-8]) cube([21,46,2],center = true);
}


module barProxy(){
    module cyl(){
        
        cylinder(20,1.5,1.5,center = true);
        rotate([0,90,0]) cylinder(20,1.5,1.5,center = true);
    }
    difference(){
        translate([0,0,0]) cube([12,50,12],center = true);

        translate([0,10,0]) cyl();
        translate([0,20,0]) cyl();
        translate([0,0,0]) cyl();
        translate([0,-10,0]) cyl();
        translate([0,-20,0]) cyl();
        scale(1.01) translate([0.5,0,-0.5]) cube([12,50,12],center = true);
    }
}



//linear_extrude(1){text("Wahooo!!");}

//translate([0,45,0]) 
//servoCage();
//translate([0,-45,0]) m2m();
//translate([45,-45,0]) multiConnector();


//translate([0,0,-30])

//rcube([10,20,30],r=0.5,center=true);
//#cube([10,20,30],r=2,center=true);



module rcube(sz=[1,1,1],r=0.5,center=true,res=12)
{

    r2 = r*2;
    x = sz[2]-r2;
    y = sz[1]-r2;
    z = sz[0]-r2;
    
    module cyl(len){
        cylinder(len,r,r,$fn=res);
    }
    module spr(){
        sphere(r,$fn=res);//,$fn=res);
    }
    
    module xcyl(){
        cyl(x,r);
        spr();
        translate([0,0,x])spr();
    }
    module ycyl(){
        rotate([-90,0,0]) cyl(y,r);
    }
    module zcyl(){
        rotate([0,90,0]) cyl(z,r);
    }

    if(roundCubes == false){
        cube(sz,center,$fn=res);        
    }else{
        translate([r+(center?sz[0]*-0.5:0),r+(center?sz[1]*-0.5:0),r+(center?sz[2]*-0.5:0)]){
            hull()
            {
                spr();
                translate([0,y,0]) spr();
                translate([z,y,0]) spr();
                translate([z,0,0]) spr();
                translate([0,0,x]) spr();
                translate([0,y,x]) spr();
                translate([z,y,x]) spr();
                translate([z,0,x]) spr();
                
                /*
                xcyl();
                translate([0,y,0]) xcyl();
                translate([z,y,0]) xcyl();
                translate([z,0,0]) xcyl();
                color("Red") ycyl();
                translate([z,0,0]) ycyl();
                translate([z,0,x]) ycyl();
                translate([0,0,x]) ycyl();
                color("Blue") zcyl();
                translate([0,y,0]) zcyl();
                translate([0,y,x]) zcyl();
                translate([0,0,x]) zcyl();
                */
            }
        }
    }
}


module invHalfCyl(rad=5,h=40){
    scale(1.01)
    difference(){
        translate([rad/2,0,0]) cube([rad,rad*2,h],center = true);
        cylinder(h+2,rad,rad,center=true);
    }
}

module spiralThing(){
    linear_extrude(height=30, twist=200, scale= 0.1)
        translate(0,0,10)
            square(10, center = true);
}

module servoHorn(){
    rotate([180,0,-90])
    translate([0,6,-19]){
        translate([0,0,-0.2]) hull(){
            translate([0,0,0]) rotate([0,0,22.5]) cylinder(3,3.5,3.5, center=true);
            translate([0,15,0]) rotate([0,0,0]) cylinder(3,2,2, center=true);
        }
        translate([0,0,3]) rotate([0,0,0]) scale(1.01) cylinder(3.5,3.5,3.5, center=true);
    }
}

module servoArm(){
    difference(){
        translate([-12,0,2]){
            rotate([0,0,180]){
                difference(){
                    translate([0,0,-1]) rcube([22,10,servoBodyHeight+16],center = true,r=2);
                    scale(1.01) translate([-7,0,-1]) cube([29,15,servoBodyHeight+9],center = true);
                }
                translate([-6,0,(servoBodyHeight/2)+2.7]) cylinder(2,5,5,center=true);
            }
        }
        translate([-6,0,1]) invHalfCyl();
      //  translate([-18,0,1]) rotate([0,0,180]) invHalfCyl();
        servoHorn();
        
        
    }
//cube([10,10,30],center=true);
    translate([0,0,-1.0]) axlePin();
    translate([-24.1,0,2]) rotate([0,90,0]) connectorWithBase();
}

module connectorSlot(){
    difference(){
        translate([0,0,0.0]) rotate([0,0,22.5]) cylinder(4,7,5,$fn = 8, center=true);
        scale(1.01) trackSub();
    }
}

module multiConnector(){
    difference(){
        difference(){
            intersection(){
                cube(15,center=true);
                sphere(11);
            }
            sphere(6);
        }
        track6();
    }
}

module m2m(){
    rotate([0,0,22.5]) cylinder(3.0,5,5,$fn=8, center = true);
    translate([0,0,-3]) rotate([0,0,0]) connector();
    translate([0,0,3]) rotate([180,0,0]) connector();
}


module trackSub(){
    scale(1.01)
    {
        hull(){
            translate([0,0,0]) connector();
            translate([12,0,0]) connector();
        }
    }
}

module track(){
    translate([0,0,5.55])
    trackSub();
}

module track2(){
    track();
    rotate([0,180,0])track();
}
module track6(){
    track2();
    rotate([90,0,90])track2();
    rotate([0,90,90])track2();
}

module connector(){
    rotate([0,0,22.5]) translate([0,0,-1]) cylinder(3.0,4.5,3.5,$fn=8);
}

module connectorWithBase(){
    translate([0,0,-1]) connector();
    //rotate([0,0,22.5]) translate([0,0,-2]) cylinder(3.0,4.5,3.5,$fn=8);
    rotate([0,0,22.5]) translate([0,0,1]) cylinder(3.0,4.5,4.5,$fn=8);
}

module axlePin(){
    rotate([0,0,0]) translate([-6,0,-15]) cylinder(4,2,2);
}

module servo() {
    
    color(color0) scale(scaleFudge) cube([24,servoBodyWidth,servoBodyHeight], center=true);  //servo body

    color(color1) translate([14,0,6.0]) scale(scaleFudge) cube([servoTabLength,servoBodyWidth,servoTabThickness], center=true); //screw tabs
    color(color2) translate([-14,0,6.0]) scale(scaleFudge) cube([servoTabLength,servoBodyWidth,servoTabThickness], center=true);//screw tabs
    color(color3) translate([-6,0,12.5]) scale(scaleFudge) cylinder(h=4.2, r=6, center=true); //Main axle hub
    
    //color(color0) translate([-2,0,12.5]) scale(scaleFudge) cylinder(h=4, r=3.75, center=true);
    color(color0) translate([-1,0,12.5]) scale(scaleFudge) cylinder(h=4, r=4.3, center=true); //Offset axle hub
    
    color(color1) translate([-6,0,16]) scale(scaleFudge) cylinder(h=3, r=2, center=true);
    
    translate([0,0,0.01]) scale(scaleFudge) axlePin();
}

module servoCage(){
    difference(){//12//22
        color(color0) translate([0,0,1.2]) rcube([26,servoBodyWidth+3,26.5], center=true,r=2);

        color(color1) translate([-12,0,-8]) rotate([0,0,0]) cube([5,11,3.5], center=true);

        color(color2) translate([16,60,10])  rotate([90,0,0]) cylinder(120,20,20,$fn=32);

        union(){
            servo();
            color(color3) translate([15,0,0])  rotate([0,0,0]) cube([20,10,18], center=true);
        }
    }
    translate([-6,9.5,2]) rotate([90,0,0]) connector();
    translate([-6,-9,2]) rotate([90,-90,0]) connectorSlot();
}


echo(version=version());
