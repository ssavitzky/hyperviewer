import {identity, rotation, makeTransform} from "./transforms";

// packages in the ndarray collection don't properly export functions, instead they
// return them from require.  Internally they have different names.
var gemm = require('ndarray-gemm'); // gemm(c, a, b[, alpha, beta]) c = alpha * a * b + beta * c

/// Transform stack:

/*
 * A transformStack is a list of transform matrices to be applied sequentially.
 * It's basically a cache for the intermediate matrices in the composition.
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
	this.modifiedFrom = 0;
    }

    nTransforms() {
	return this.stack.length;
    }
    
    /*
     * add a transform to the stack.  Defaults to an identity transform.
     */
    addTransform(transform) {
	if (transform === undefined) {
	    transform = identity(makeTransform(this.dim));
	}
	this.stack.push(transform);
	if (this.nTransforms() > 0) {
	    this.temps.push(makeTransform(this.dim));
	} else {
	    this.temps.push(transform);
	}
	// note that we don't have to set modifiedFrom; before we started
	// it was at most stack.length.
	return this;
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
	this.modifiedFrom = this.nTransforms();
	return this;
    }

    /*
     * Return the composition of all the transforms in the stack
     */
    getComposed() {
	if (this.modifiedFrom < this.nTransforms()) {
	    this.composeFrom(this.modifiedFrom);
	    this.modifiedFrom = this.nTransforms();
	}
	return this.temps[this.nTransforms() - 1];
    }

    /*
     * Return transform n.  
     */
    getTransform(n) {
	return this.stack[n];
    }
    
    /*
     * Modify transform n.  
     *   This applies a function to transform [n] and remembers the
     *   minimum n so that composed can recompute the composite transform.
     *   Adds identity transforms if n is >= the current size of the stack.
     */
    modifyTransform(n, modify) {
	for (let i = this.nTransforms(); i < n + 1; ++i) {
	    this.addTransform();
	}
	if (n < this.modifiedFrom) {
	    this.modifiedFrom = n;
	}
	this.stack[n] = modify(this.stack[n]);
	return this;
    }

    /*
     * setRotation
     */
    setRotation(n, x1, x2, theta) {
	return this.modifyTransform(n, (transform) => {
	    return rotation(transform, x1, x2, theta);
	});
    }
}

/*
 * We initialize and control a transformStack with a list of rotationStates.
 * rotationStates probably ought to include start time so that they don't depend on uniform ticks.
 */
export class rotationState {
    constructor(index, axis1, axis2, angle, delta) {
	this.index = index;
	this.axis1 = axis1;
	this.axis2 = axis2;
	this.angle = angle;
	this.delta = delta;
    }

    applyTo(transformStack) {
	transformStack.setRotation(this.index, this.axis1, this.axis2, this.angle);
    }

    /*
     * add delta to angle; return true if delta is non-zero
     */
    tick() {
	this.angle += this.delta;
	return(this.delta !== 0);
    }
}
