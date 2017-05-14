// Case for the Orange Pi Zero based configurator
//
// Note that 0/0 (x/y) is the center of the lower left mounting
// hole of the PCB, 


$fn = 50;
eps = 0.05;
eps2 = 2 * eps;
tol = 0.3;
tol2 = 2 * tol;

bottom_t = 0.9;
top_t = 0.9;
wall_t = 1.5;

pcb_dim = [48, 46, 1.6];
pcb_r = 3;

gap_around_pcb = 4;
solder_clearance = 3;

// Dimension of the RJ45 connector part that is sticking out of the PCB
rj45_dim = [16, 16.4, 13.2];
rj45_pos = [-3, 12, bottom_t+solder_clearance+pcb_dim.z];
rj45_top = rj45_pos.z + rj45_dim.z;

micro_usb_connector_dim = [10, 12, 10];
micro_usb_dim = [4, 8, 3];
micro_usb_pos = [39, 3, rj45_pos.z];
micro_usb_top = bottom_t+solder_clearance+4.5;

button_pos = [34, 30, 0];


// Calculated values

gap2 = 2 * gap_around_pcb;
pcb_z = bottom_t + solder_clearance;

wall_t2 = 2 * wall_t;
wall_h = pcb_z + 20;

inside_dim = [pcb_dim.x+gap2, pcb_dim.y+gap2, wall_h-bottom_t+eps];
inside_r = pcb_r + gap_around_pcb;

outside_dim = [inside_dim.x+wall_t2, inside_dim.y+wall_t2, wall_h];
outside_r = inside_r + wall_t;

lid_dim = [outside_dim.x, outside_dim.y, top_t];
lid_r = outside_r;




//==============================================================
case();
//%translate([0, 0, pcb_z]) pcb();

//rotate([180, 0, 0])
lid();

//==============================================================
module case() {
    difference() {
        union() {
            difference() {
                // Outside shape. 
                translate([0, 0, 0])
                    rounded_cube(outside_dim, outside_r);

                // Inside shape
                translate([0, 0, bottom_t])
                    rounded_cube(inside_dim, inside_r);
            }

            // PCB mounts
            translate([0, 0, bottom_t])
                pcb_mounts();
            
            // Guide for RJ45
            translate([-pcb_r-gap_around_pcb-eps, rj45_pos.y-1-tol/2, 0])
                cube([gap_around_pcb-0.5, rj45_dim.y+tol+2, rj45_top]);

            // Guide for Micro-USB plug
            translate([pcb_dim.x-gap_around_pcb+1.5, 7-2-micro_usb_connector_dim.y/2, 0])
                cube(micro_usb_connector_dim + [-6, 4, 3]);
        }

        // RJ45 connector cut-out
        translate(rj45_pos - [7, tol/2, 0])
            cube(rj45_dim + [5, tol, tol]);
        
        // LED cut-out
        led_apature_z = bottom_t + solder_clearance + pcb_dim.z;
        translate([pcb_dim.x-pcb_r+gap_around_pcb, 34, led_apature_z]) 
            led_apature_right(h=wall_t);
        
        // Micro-USB connector cut-out
        usb_z = bottom_t + solder_clearance + 2 - micro_usb_connector_dim.z / 2;
        translate([pcb_dim.x-pcb_r, 7-micro_usb_connector_dim.y/2, usb_z]) 
            cube(micro_usb_connector_dim);
   }
}

//==============================================================
module lid() {
    w = 2 * (inside_r - tol);
    z = rj45_top + tol;
    h = wall_h - z;
    
    wall_dim = [inside_dim.x-tol, inside_dim.y-tol, h];
    wall_r = inside_r-tol;
    
    difference() {
        union() {
            // Top-most cover
            translate([0, 0, wall_h])
                rounded_cube(lid_dim, lid_r);
            
            // Rim that closes the lid
            translate([0, 0, z]) {
                difference() {
                    rounded_cube(wall_dim, wall_r);
                    translate([0, 0, -eps])
                        rounded_cube(wall_dim-[wall_t2, wall_t2, -eps2], wall_r-wall_t);
                }
            }
            
            // Hold-down for the RJ45
            translate([-inside_r+tol, rj45_pos.y, z])
                cube([rj45_dim.x, rj45_dim.y, h]);

            // Hold-down for the micro-USB connector
            translate([micro_usb_pos.x, micro_usb_pos.y, micro_usb_top])
                cube([micro_usb_dim.x, micro_usb_dim.y, wall_h-micro_usb_top]);
        }
        
        // Button activator cut-out
        translate(button_pos + [0, 0, wall_t2]) {
            difference() {
                d = 10;
                cylinder(d=d, h=wall_h);
                translate([0, 0, -eps]) cylinder(d=d-1.5, h=wall_h+eps2);
                translate([0, -d/4, -eps]) cube([d, d/2, wall_h+eps2]);
            }
        }
    }
}

//==============================================================
module pcb() {
    difference() {
        color("DarkGreen") rounded_cube(pcb_dim, pcb_r);
        pcb_mounts();
    }
}

//==============================================================
module pcb_mounts(d=2, h=3, d_wide=2.8, eps=eps) {
    d1 = d_wide ? d_wide : d; 
    d_socket = 5;
    h_socket = solder_clearance - tol;
    pos = [pcb_dim.x-2*pcb_r, pcb_dim.y-2*pcb_r];
    
    for (p = [[0, 0, 0], [pos.x, 0, 0], [0, pos.y, 0], [pos.x, pos.y, 0]]) {
        translate(p) {
            cylinder(d=d_socket, h=h_socket);
            translate([0, 0, h_socket]) cylinder(d1=d1, d2=d, h=h);
        }
    }
    
}

//==============================================================
module rounded_cube(dim, r=3) {
    d = 2 * r;

    minkowski() {
        cube(dim - [d, d, eps], false);
        cylinder(r=r, h=eps);
    }
}

//==============================================================
module led_apature_top(h=3) {
    w = 2.5; 
    l = 5;
    hull() {
        translate([-w/2, (l-w)/2, -eps]) 
            cylinder(d=w, h=h+eps2);
        translate([-w/2, -(l-w)/2, -eps]) 
            cylinder(d=w, h=h+eps2);
    }
}

//==============================================================
module led_apature_right(h=3) {
    rotate([0, 90, 0])
        led_apature_top(h=h);
}