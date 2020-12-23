eps = 0.05;
eps2 = 2 * eps;
epsz = [0, 0, -eps];

$fn = 80;

d_outer = 13;
d_outer_top = 13.8;
h = 13.5;
h_cone = 7.5;

d_screw = 2.5;
screw_y = h/2;

d_antenna = 10;

tol = 0.3;

chamfer = 1;
slot_w = 1;


d_guide_top = 18+tol;
d_guide_bottom = 20+tol;
d_guide_outside = 24;

plug();
//translate([d_outer*1.5, 0, 0]) 
//mirror([0, 0, 1]) drill_guide();

module plug() {
    difference() {
        union() {
            cylinder(d=d_outer-tol, h=h);
            cylinder(d1=d_outer_top-tol, d2=d_outer-tol, h=h_cone);
        }
        
        translate(epsz) cylinder(d=d_antenna+tol, h=h+eps2);

        translate([0, 0, screw_y]) rotate([90, 0, 0]) cylinder(d=d_screw, h=d_outer);
    }
}

module drill_guide() {
    rim = 1;
    hole_y = rim + d_screw/2;
    guide_h = h - screw_y + hole_y;
    
    w = d_outer/sqrt(2)+0.5;
    
    
    difference() {
        cylinder(d=d_guide_outside, h=guide_h);
        translate(epsz) cylinder(d1=d_guide_bottom, d2=d_guide_top, h=guide_h+eps2);
        translate([0, 0, hole_y]) rotate([90, 0, 0]) cylinder(d=d_screw, h=d_outer);
        rotate([0, 0, 45]) translate([-w/2, -w/2, -eps]) cube([w, w, guide_h+eps2]);
        rotate([0, 0, 45]) translate(epsz) cube([d_outer, slot_w, guide_h+eps2]);
    }
}
