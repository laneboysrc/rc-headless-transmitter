
$fn = 100;

fudge = 0.05;
fudge2 = 2 * fudge;
fudgez = [0, 0, -fudge];

tol = 0.3;
inch = 25.4;

dim = [12, 12, 7];

button_base_dim = [8, 7, 4];
button_d = 7;

chamfer_z = dim.z - 3;
pcb_dim = [dim.x+8, dim.y, fudge2];

screw_d = 1.7;

difference() {
    union() {
        rounded_cube(dim, 0, "xy");
        hull() {
            rounded_cube(pcb_dim, 0, "xy");
            translate([0, 0, chamfer_z]) rounded_cube([dim.x, dim.y, fudge2], 0, "xy");
        }
    }
    translate(fudgez) {
        rounded_cube(button_base_dim, 0, "xy");
        cylinder(d=button_d, h=dim.z+fudge2);
        translate([0.3*inch, 0, 0]) cylinder(d=screw_d, h=dim.z+fudge2);
        translate([-0.3*inch, 0, 0]) cylinder(d=screw_d, h=dim.z+fudge2);
    }
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