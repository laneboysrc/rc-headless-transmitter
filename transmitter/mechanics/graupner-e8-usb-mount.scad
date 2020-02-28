
$fn = 100;

fudge = 0.05;
fudge2 = 2 * fudge;
fudgez = [0, 0, -fudge];

tol = 0.3;
inch = 25.4;

pcb_t = 1.5;

//dim1 = [17, 8.5-pcb_t, 1];
dim2 = [13.5, 6.2-pcb_t, 5];
dim3 = [13.5, 6.2-4, 6.7];
pos3 = [0, dim2.y-dim3.y, 0];

//centered_cube(dim1, center="x");
centered_cube(dim2, center="x");
translate(pos3) centered_cube(dim3, center="x");
translate(pos3+[0, 0, dim3.z]) centered_cube([dim3.x, dim3.y+0.7, 0.5], center="x");

module centered_cube(dim, center="") {
    x = search("x", center) ? 0 : dim.x/2;
    y = search("y", center) ? 0 : dim.y/2;
    z = search("z", center) ? 0 : dim.z/2;
    translate([x, y, z])
        cube(dim, true);
}