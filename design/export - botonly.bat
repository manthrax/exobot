del *.stl
del *.gcode
"C:\Program Files\OpenSCAD\openscad.exe" -D"npart=0" -o servoArm.stl roboparts.scad
"C:\Program Files\OpenSCAD\openscad.exe" -D"npart=65" -o quadStrut.stl roboparts.scad
"C:\Program Files\OpenSCAD\openscad.exe" -D"npart=20" -o foot.stl roboparts.scad
"C:\Program Files\OpenSCAD\openscad.exe" -D"npart=17" -o servoSleeveWithMultiConnectors.stl roboparts.scad
REM "C:\Program Files\OpenSCAD\openscad.exe" -D"npart=5" -o m2m.stl roboparts.scad
REM "C:\Program Files\OpenSCAD\openscad.exe" -D"npart=10" -o servoSleeve.stl roboparts.scad
REM "C:\Program Files\OpenSCAD\openscad.exe" -D"npart=15" -o servoSleeveWithConnectors.stl roboparts.scad
REM "C:\Program Files\OpenSCAD\openscad.exe" -D"npart=50" -o sensorClamp.stl roboparts.scad
REM "C:\Program Files\OpenSCAD\openscad.exe" -D"npart=60" -o servoCage.stl roboparts.scad
REM "C:\Program Files\OpenSCAD\openscad.exe" -D"npart=40" -o base.stl roboparts.scad
REM "C:\Program Files\OpenSCAD\openscad.exe" -D"npart=30" -o baseClamp.stl roboparts.scad
