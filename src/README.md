Viewer for n-dimensional objects
================================

## Notes

### State

The state of the viewer is determined by:

* the size of the canvas -- assume square
* the figure
* the list of rotations [axis1, axis2, angle, increment]
  - each axis is controlled by 2 sliders, one 0-90 degrees, one 0-?
	degrees/second; the 0-90 control could be a dial instead.
	
* the perspective [dz, ... dt] - doesn't need x or y, obviously.
  - controlled by dim-2 sliders.

### Perspective:

Each axis can be handled separately, and the x and y axes get the same
treatment, so without loss of generality we have:

* [x, z] = the relevant coordinates of the vertex v at [x, y, z1, z2, ...]
* p = the position of the camera along the negative z axis (so the camera is
  actually at [0, -p], and the z axis points away from the camera.)
* Q = (width of screen)/2.
* q = value of x in the xy plane that is projected onto the screen at Q
* we want X = the position of the vertex in pixels from the center of the view
  box.

Note that q > 1.0, because the line from p to Q is tangent to the unit
sphere.  We'll get to that later.

So on the x axis, x/q projects onto X/Q, so X = (Q/q)x.

Along the z axis, points on a line from [0,p] to [x,0] have an x coordinate
proportional to their distance from the camera, so a line through the point at
[x,z] intersects the z=0 plane at x/(z+p).

Putting it together, X = (Q/q)x/(z+p).

Now all we need is q.  q is the point where a line tangent to the unit sphere
intersects the x axis.  The tangent point is at the right-angled corner of a
triangle whose hypotenuse is p and base is 1.0, so the viewing angle A is
arcsin(1/p).  The tangent line is also the hypotenuse of a triangle whose base
has length q and opposite side p, so q = tan(arccos(1/p)).  This approaches 1
as p goes to infinity.

> _Aside_: this would probably have been simpler if I'd used paper and pencil.

Alternatively, and much simpler, one could control the view with the viewing
angle (2A, because this is only one side).  That would make p = 1/sin(A) =
sec(A), and q = cot(A).

