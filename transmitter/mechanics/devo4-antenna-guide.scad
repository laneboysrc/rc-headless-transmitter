eps = 0.05;
eps2 = 2 * eps;
epsz = [0, 0, -eps];

$fn = 50;

d_ring = 16;
d_outer = 20;
h = 8;
h_rim = 2;
z_rim = 2;

d_screw = 6;
screw_y = 6;

d_antenna = 11;
d_antenna_recess = 11;
h_antenna = 3;


difference() {
    union() {
        cylinder(d=d_ring, h=h);
        translate([0, 0, z_rim]) cylinder(d1=d_ring, d2=d_outer, h=1.5);
        translate([0, 0, z_rim+1.5]) cylinder(d=d_outer, h=h_rim-1.5);
    }
    
    translate(epsz) cylinder(d=d_antenna, h=h+eps2);
    translate(epsz) cylinder(d=d_antenna_recess, h=h-h_antenna+eps);

    translate([0, 0, screw_y-(d_screw/2)]) rotate([90, 0, 0]) cylinder(d=d_screw, h=d_outer+eps2, center=true);
    cube([d_screw, d_outer+eps, d_screw+(screw_y-(d_screw/2))/2], center=true);
    
    translate([d_ring/2, -d_outer/2, -eps]) cube([d_outer, d_outer, h+eps2]);
    mirror([1, 0, 0] )translate([d_ring/2, -d_outer/2, -eps]) cube([d_outer, d_outer, h+eps2]);
    
}

