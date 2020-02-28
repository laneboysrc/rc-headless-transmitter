
$fn = 100;

fudge = 0.05;
fudge2 = 2 * fudge;
fudgez = [0, 0, -fudge];

tol = 0.3;

dim = [59, 15, 0.5];
d1 = 6.4 - tol;
d2 = 8.2 - tol;
d_switch = 6.4 + tol;
plug_z = 3 + dim.z;
r = 1;

x_switch1 = 5;
x_switch2 = 20;
x_switch3 = 48;

difference() {
    union() {
        rounded_cube(dim, r, "y");
        translate([x_switch1, 0, 0]) cylinder(d1=d1, d2=d1-1, h=plug_z);
        translate([x_switch3, 0, 0]) cylinder(d1=d2, d2=d2-1, h=plug_z);
    }
        translate([x_switch2, 0, -fudge]) cylinder(d=d1, h=plug_z);
}


module centered_cube(dim, center="") {
    x = search("x", center) ? 0 : dim.x/2;
    y = search("y", center) ? 0 : dim.y/2;
    z = search("z", center) ? 0 : dim.z/2;
    translate([x, y, z])
        cube(dim, true);
}

module rounded_cube(dim, r=3, center="") {
    d = 2 * r;
    fudge = 0.05;
    
    x = search("x", center) ? 0 : dim.x/2;
    y = search("y", center) ? 0 : dim.y/2;
    z = search("z", center) ? 0 : dim.z/2;
    translate([x, y, z])
        minkowski() {
            cube(dim - [d, d, fudge], true);
            cylinder(r=r, h=fudge);
        }
}