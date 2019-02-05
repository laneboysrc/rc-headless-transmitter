eps = 0.05;
eps2 = 2 * eps;
epsz = [0, 0, -eps];
$fa = 1;
$fs = 0.5;

x = 24.6;
y = 10;
h = 3;
sw_x = 6;
sw_w = 9;
sw_y = 3.5;
screw_distance = 19;
screw_d = 1.6;
screw_y = 2.5;

screw_x = (x - screw_distance) / 2;


difference() {
    cube([x, y, h]);
    translate([screw_x, screw_y, -eps]) cylinder(d=screw_d, h=h+eps2);
    translate([screw_x+screw_distance, screw_y, -eps]) cylinder(d=screw_d, h=h+eps2);

    translate([sw_x, sw_y, -eps])cube([sw_w, y, h+eps2]);

}
