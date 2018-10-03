import {sin, cos} from 'math';

// packages in the ndarray collection don't properly export functions, instead they
// return them from require.  Internally they have different names.
var ndarray = require("ndarray");
var gemm = require('ndarray-gemm'); // gemm(c, a, b[, alpha, beta]) c = alpha * a * b + beta * c
var mvp = require("ndarray-matrix-vector-product");
var fill = require('ndarray-fill');

/*
 * This package creates, composes, and applies linear transforms.
 */

export function makeTransform(dim) {
    return ndarray(new Float64Array(dim * dim), [dim, dim]);
}
export function makePoint(dim) {
    return ndarray(new Float64Array(dim), [dim]);
}

/// Identity:

/*
 * initialize a square matrix, dest, to an identity transform.
 */
export function identity(dest) {
    fill(dest, (i, j) => {
	return (i === j)? 1.0 : 0.0;
    });
    return dest;
}

/// Rotation:

/*
 * Initialize a square matrix, dest, to a rotation transform.  The
 *     rotation is theta from component x1 toward x2, i.e., x1 and x2
 *     define the invariant plane of the rotation.  
 *
 * In three dimensions, rotation(c, 0, 2, PI/2) rotates [1, 0, 0] into [0, 0, 1]
 * In four dimensions, there are six principal planes defined by pairs of axes; 
 * a simple rotation leaves the orthogonal plane stationary.  Double rotations, 
 * in two planes at once, can be decomposed into imple rotations.
 * See also, https://en.wikipedia.org/wiki/Rotations_in_4-dimensional_Euclidean_space
 * and http://www.eusebeia.dyndns.org/4d/vis/10-rot-1
 */
export function rotation(dest, x1, x2, theta) {
    fill(dest, (i, j) => rotationFill(i, j, x1, x2, sin(theta), cos(theta)));
    return dest;
}

/*
 * Initialize a square matrix, dest, to a rotation transform, using the sine and
 * cosine of the rotation angle.  This should be used with a precomputed table of
 * sines and cosines.
 */
export function rotation2(dest, x1, x2, sinTheta, cosTheta) {
    fill(dest, (i, j) => rotationFill(i, j, x1, x2, sinTheta, cosTheta));
}

/*
 * Fill function for a rotation matrix.
 * 
 *   Passing the sine and cosine explicitly would make it faster if we decide to use
 *   a precomputed table instead of computing the sine and cosine every time.
 *    In two dimensions, we want:
 *    [ cos, -sin ]
 *    [ sin,  cos ]  Notice that an angle of zero gives you an identity matrix.
 */
function rotationFill(i, j, x1, x2, sinTheta, cosTheta) {
    return ( (i === x1 && j === x2)? sinTheta :
	     (i === x2 && j === x1)? - sinTheta :
	     (i === x1 && j === x1)? cosTheta :
	     (i === x2 && j === x2)? cosTheta :
	     (i === j)? 1 : 0);    
}

/// Composing transforms

export function compose(dest, t1, t2) {
    gemm(dest, t1, t2);
    return dest;
}

/// Applying transforms

/*
 * Transform a point
 */
export function apply(dest, transform, point) {
    if (dest === undefined) {
	dest = makePoint(point.size);
    }
    mvp(dest, transform, point);
    return dest;
}

/*
 * Map a transform down a list of vertices.
 *
 * If the destination is undefined or empty, it gets initialized.
 * Thus, this function can be used as if it's an actual function.
 * That would be inadvisable.
 */
export function map(dest, transform, points) {
    if (dest === undefined) {
	dest = [];
    }
    if (dest.length < points.length) {
	let dim = points[0].size;
	for (let i = dest.length; i < points.length; ++i) {
	    dest.push(ndarray(new Float64Array(dim)));
	}
    }
    for (let i = 0; i < points.length; ++i) {
	mvp(dest[i], transform, points[i]);
    }
    return dest;
}
