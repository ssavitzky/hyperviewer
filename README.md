HyperViewer
===========

## Show objects rotating in hyperspace.

(Actually, it can handle two and three dimensions, too.)

At the moment the only controls are a pair of sliders -- the left-hand one
controls the dimensionality, and the right-hand one selects the object.
Currently only the simplex, octoplex, and cube are implemented.

## Documentation

... is pretty sketchy at this point, but there is a narrative of the
development process at [Adventures in hyperspace (and
JavaScript)](https://computer-curmudgeon.com/2018/10/08/adventures-in-hyperspace.html)

## To do

  * Replace the object-selection slider with a dropdown selector.
  * Add sliders to control the overall rotation rate (frames per second) and
	the perspective viewing angles (N-2 in N dimensions).
  * Add custom controls for the rotations.  They have to be fairly small: in N
	dimensions there are (N)(N-1) different rotations, each in the plane
	defined by two of the axes.  For 6-D you need 30.  Each control needs a
	selector for the axes (probably a drop-down) a delta, and an initial value.
  * Fix the simplex; placement of the final vertex is wrong.
  * Add the dodecahedron, icosahedron, 24-cell, 120-cell, and 600-cell.
  * Add the ability to read and write objects (vertices, edges, etc.)
  * Add the ability to color (some of) the faces.  See the (HyperSpace
	Express)[https://hyperspace-express.com/] logo for the motivation.

## Implementation notes

This project was bootstrapped with [Create Inferno
App](https://github.com/infernojs/create-inferno-app), as a way of becoming
more familiar with Javascript and [Inferno](https://github.com/infernojs/), (a
lightweight alternative to React).
