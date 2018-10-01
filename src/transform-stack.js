import {zeros} from 'zeros';
//import {sin, cos} from 'math';

// packages in the ndarray collection don't properly export functions, instead they
// return them from require.  Internally they have different names.
var ndarray = require("ndarray");
var gemm = require('ndarray-gemm'); // gemm(c, a, b[, alpha, beta]) c = alpha * a * b + beta * c
//var mvp = require("ndarray-matrix-vector-product");
//var fill = require('ndarray-fill');

/// Transform stack:

/*
 * A transformStack is a list of transform matrices to be applied sequentially.
 *
 * Since matrix multiplication requires an empty matrix as a destination, we
 * also define a parallel list of scratch matrices.  The last of the scratch
 * matrices is the final product, and in general temps[n] is the product of
 * stack[0]...stack[n].
 *
 * In the case of the kind of animation we want to do, we need to be
 * able to apply a sequence of rotations repeatedly.  There are two
 * different ways we could do that, and they're not equivalent because
 * matrix multiplication doesn't commute:
 *
 * 1. Combine all the rotations into a single incremental transform and 
 *    apply it to the previous set of vertex points.  That would be more
 *    efficient, but it doesn't generalize to other kinds of transform such 
 *    as scaling or perspective.
 *
 * 2. Generate a new stack for each frame, with the rotation angles
 *    incremented.  That's what we need if we want to control the angles
 *    or rates with sliders, so we may as well do it right to start with.
 *
 * 3. We could use a combination of 1 and 2, pre-rotating the polytope by
 *    one set of rotations, and applying another, changing, set for animation.
 */
export class transformStack {
    /*
     * The argument to the constructor specifies the dimensionality.
     */
    constructor(dim) {
	this.dim = dim;
	this.stack = [];
	this.temps = [];
    }

    nTransforms() {
	return this.temps.length;
    }
    /*
     * add a transform to the stack.
     */
    addTransform(transform) {
	this.stack.push(transform);
	let d = this.dim;
	if (this.nTransforms() > 0) {
	    this.temps.push(ndarray(zeros([d, d]), [d, d]));
	} else {
	    this.temps.push(transform);
	}
	return this.composeFrom(this.nTransforms() - 1);
    }

    /*
     * Compose the transforms, starting at index n.
     *
     * The product of transforms 0..n is in temps[n]
     */
    composeFrom(n) {
	for (let i = n; i < this.nTransforms(); ++i) {
	    if (i === 0) {
		this.temps[i] = this.stack[i];
	    } else {
		gemm(this.temps[i], this.temps[i-1], this.stack[i]);
	    }
	}
	this.modifiedFrom = this.nTransforms;
	return this;
    }

    /*
     * Return the composition of all the transforms in the stack
     */
    getTransform() {
	if (this.modifiedFrom < this.nTransforms) {
	    this.composeFrom(this.modifiedFrom);
	}
	return this.temps[-1];
    }

    /*
     * Modify transform n.  This returns transform [n] and remembers
     *   the minimum n so that composed can recompute the composite transform.
     */
    modifyTransform(n) {
	if (n > this.modifiedFrom) {
	    this.modifiedFrom = n;
	}
	return this.temps[n];
    }
}
