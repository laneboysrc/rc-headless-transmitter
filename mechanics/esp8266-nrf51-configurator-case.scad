eps = 0.05;
eps2 = 2 * eps;
$fa = 1;
$fs = 0.5;


// PCB dimensions
pcb_board = [64, 74.5, 1.6];
pcb_top = [51, 69, 14.5];
pcb_bottom = [51, 55, 2];
usb = [8, 6, 3];
usb_pos = [pcb_board.x - 19 - usb.x, -1.2, 1];    // Position from left-front of the PCB
switch = [8, 6, 3.5];
switch_pos = [16.2, -2, 0.5];

pcb_offset_z = 2;

// Case
inner = [62, pcb_board.y+0.5, 19];
outer = [65, inner.y+1.5, 22];

// Lid
lid_dim = [outer.x, 2.5, outer.z];


//##############################################################
// Design
//translate([0, 0.25, pcb_board.z+pcb_bottom.z+pcb_offset_z])
//    color("brown")  
//        pcb();

translate([0, 0, 0])
//    color("green", 0.5) 
        case();

translate([0, -2.5, 0])
//    color("yellow", 0.5) 
        lid();


//##############################################################
// For printing
//rotate([-90, 0, 0])
//    translate([0, -outer.y, 0])
//        case();

//rotate([-90, 0, 0])
//    translate([0, -lid_dim.y, 0])
//        lid();


//##############################################################
module cube_x(dim) 
{
    translate([-dim.x/2, 0, 0])
        cube(dim);
}    

//##############################################################
module rounded_box(dim) 
{
    cube_x(dim - [dim.z/2, 0, 0]);
    
    translate([-(dim.x/2-dim.z/4), 0, dim.z/2])
        rotate([-90, 0, 0])
            cylinder(d=dim.z, h=dim.y);

    translate([(dim.x/2-dim.z/4), 0, dim.z/2])
        rotate([-90, 0, 0])
            cylinder(d=dim.z, h=dim.y);
}    

//##############################################################
module pcb() 
{
    cube_x(pcb_top);
    translate([0, 0, -pcb_board.z])
        cube_x(pcb_board);
    translate([0, 0, -pcb_bottom.z-pcb_board.z])
        cube_x(pcb_bottom);
    
    translate(usb_pos - [pcb_board.x/2, 0, 0])
        cube(usb);

    translate(switch_pos - [pcb_board.x/2, 0, 0])
        cube(switch);
}

//##############################################################
module case()
{
    // Outer case with constant wall thickness
    translate([0, 0, outer.z/2]) {
        difference() {
            translate([0, 0, -outer.z/2])
                rounded_box(outer);

            translate([0, -eps, -inner.z/2])
                rounded_box(inner + [0, eps, 0]);
        }
    }
        
    // PCB guides
    intersection() {
        difference() {
            union() {
                translate([-32, 0, 0]) 
                    cube_x([10, inner.y, outer.z]);

                translate([32, 0, 0]) 
                    cube_x([10, inner.y, outer.z]);
            }

            // Slot for the PCB
            translate([0, -eps, 3.75]) 
                rounded_box([pcb_board.x+1, inner.y+eps, pcb_board.z+0.5]);

            // Screw holes for M3x12
            translate([-outer.x/2, -eps, outer.z/2])
                rotate([-90, 0, 0])
                    cylinder(d=2.5, h=15);
            
            translate([outer.x/2, -eps, outer.z/2])
                rotate([-90, 0, 0])
                    cylinder(d=2.5, h=15);
        }
        rounded_box(outer);
    }
}

//##############################################################
module lid()
{
    difference() {
        rounded_box(lid_dim);

        translate([lid_dim.x/2, -eps, lid_dim.z/2])
            rotate([-90, 0, 0])
                cylinder(d1=6.5, d2=3, h=lid_dim.y+eps2);

        translate([-lid_dim.x/2, -eps, lid_dim.z/2])
            rotate([-90, 0, 0])
                cylinder(d1=6.5, d2=3, h=lid_dim.y+eps2);

        translate([-pcb_board.x/2, 0, pcb_board.z+pcb_bottom.z+pcb_offset_z]) {
            translate(usb_pos - [0.5, 0, 0.5])
                cube(usb + [1, 1, 1]);

            translate([usb_pos.x+4, -eps, usb_pos.z-4])
                rounded_box([usb.x+8, 1.5, usb.z+8]);
            
            translate(switch_pos - [0.5, 0, 0.5])
                cube(switch + [1, 1, 1]);
        }
    
     }
}


