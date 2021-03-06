import {tan, sin, PI} from 'math';
import {map} from './transforms';
import {identity, rotation, makeTransform, gemm} from "./transforms";

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
	this.dimensions = dim;
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
	    transform = identity(makeTransform(this.dimensions));
	}
	this.stack.push(transform);
	if (this.nTransforms() > 0) {
	    this.temps.push(makeTransform(this.dimensions));
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
	if (this.nTransforms === 0) {
	    this.addTransform();
	}
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
	if (x1 >= this.dimensions || x2 >= this.dimensions)
	{
	    return this;
	}
	return this.modifyTransform(n, (transform) => {
	    return rotation(transform, x1, x2, theta);
	});
    }

    getScreenPoints(vertices, viewingAngle, screenSize) {
	//let transformed = this.transform(vertices);
	return this.applyPerspective(viewingAngle, screenSize, vertices);
    }
    
    /*
     * Apply a linear transform, which is a [dim, dim] ndarray, to all
     * the vertices of the polytope.  The results are in the parallel
     * list this.transformed.
     *
     * The first time through, we initialize this.transformed; after that
     * we re-use it to avoid excess memory allocations.
     * TODO:  consider whether to generate screenPoints directly
     */
    transformPoints(vertices) {
	let xform = this.nTransforms() > 0
	    ? this.getComposed()
	    : identity(makeTransform(this.dimensions));
	this.transformed = map(this.transformed, xform, vertices);
	return this.transformed;
    }

    /*
     * Apply a perspective transform for viewingAngle and screenSize. 
     *   return the list of [x, y] screen coordinates for the vertices.
     *
     *   See notes for the derivation.  We assume the same viewing angle
     *   for all projections.
     */
    applyPerspective(viewingAngle, screenSize, transformed) {
	let screenPoints = [];
	let nVertices = transformed.length;
	let Q = screenSize/2;
	let A = viewingAngle/2;
	let p = 1/tan(A);	// distance from viewpoint to origin
	// r corrects for the fact that the viewing cone needs to be tangent to the
	// unit sphere.   The solution is to either move the sphere back a little.
	// (Former solutions tried to, effectively, shrink it; that doesn't work
	// because we have to add something to the denominator, not multiply it.)
	// so p + r = 1/sin(A), and
	let r = 1 / sin(A) - p;
	// it's safe to compute p and r even when A=0, as long as we don't use them.
	for (let n = 0; n < nVertices; ++n) {
	    let X = transformed[n].get(0);
	    let Y = transformed[n].get(1);
	    if (A !== 0) {
		for (let i = 2; i < this.dimensions; ++i) {
		    let z = transformed[n].get(i);
		    X = p * X / (z + p + r);
		    Y = p * Y / (z + p + r); 
		}
	    }
	    //X = transformed[n].get(0); Y = transformed[n].get(1); // ortho for debugging
	    if (screenPoints.length < n+1) {
		screenPoints.push([Q + Q * X, Q - Q * Y]);
	    } else {
		screenPoints[n][0] = Q + Q * X;
		screenPoints[n][1] = Q - Q * Y;  // y = 0 is at the top
	    }
	}
	return screenPoints;
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

    applyTo(transformStack, cycles) {
	let angle = this.angle + this.delta * (cycles? cycles : 1);
	transformStack.setRotation(this.index, this.axis1, this.axis2, angle);
    }

    /*
     * add delta to angle; return this if unchanged, new state if updated
     * This can be used instead of multiplying the angle by the cycle number.
     */
    tick() {
	if (this.delta === 0) {
	    return this;
	}
	let angle = this.angle+this.delta;
	if (angle >= PI * 2) {
	    angle -= PI *2;
	}
	return new rotationState(this.index,
				 this.axis1, this.axis2,
				 angle, this.delta);
    }
}
