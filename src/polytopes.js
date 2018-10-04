import {sqrt, tan, sin} from 'math';
import {map} from './transforms';
var ndarray = require("ndarray");  // can't use import here.  JS is weird.

/*
 * This package lets us create and transform n-dimensional polytopes.
 */

/* 
 * Polytope.  
 *   .vertices is the list of vertices, in the form of n*1 ndarrays.
 *   .edges is a list of pairs of vertex indices.
 *   .faces is a list of lists of vertices (not of edges), and is optional
 *          in case we want to color some of the faces.  (On the other hand
 *          we might want them to be polytopes of dimension 2, which generalizes.
 *          If we do, we'll want an init method.)
 *
 * See http://www.eusebeia.dyndns.org/4d/regular for the construction
 * of all six four-dimensional polytopes.  (It may be a while before I
 * get there.)  Dimensions greater than four have only the cube, kite,
 * and simplex.
 */
export class polytope {
    constructor(dim, nVertices, nEdges) {
	this.dimension = dim;
	this.nVertices = nVertices;
	this.nEdges = nEdges;
	this.vertices = [];
	this.edges = [];
	this.faces = [];
	this.transformed = [];	// transformed vertices (temporary)
	this.screenPoints = [];
	return this;
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
    applyTransform(transform) {
	this.transformed = map(this.transformed, transform, this.vertices);
    }

    /*
     * Apply a perspective transform for viewingAngle and screenSize. 
     *   return the list of [x, y] screen coordinates for the vertices.
     *
     *   See notes for the derivation.
     */
    applyPerspective(viewingAngle, screenSize) {
	let Q = screenSize/2;
	let A = viewingAngle/2;
	let r = Q / tan(A);
	let p = 1/sin(A);
	for (let n = 0; n < this.nVertices; ++n) {
	    let x = this.transformed[n].get(0);
	    let y = this.transformed[n].get(1);
	    let z = this.transformed[n].get(2); // TODO: Revisit this.
	    let X = Q + r * x / (z + p);
	    let Y = Q - r * y / (z + p); // y = 0 is at the top
	    //X = Q + Q * x; Y = Q + Q * y; // ortho projection for debugging
	    if (this.screenPoints.length < n+1) {
		this.screenPoints.push([X, Y]);
	    } else {
		this.screenPoints[n][0] = X;
		this.screenPoints[n][1] = Y;
	    }
	}
    }
}

/*
 * Hypercube (measure polytope)
 *    2^d vertices corresponding to the d-bit numbers.
 *    the coordinates of vertex n correspond to the bits in n.
 *    Edges connect each vertex to its n neighbors.
 */
export class cube extends polytope {
    constructor(dim) {
	super(dim, 1 << dim, (1 << dim) * dim / 2);
	this.name = 'cube';
	// We want the vertices to land on the unit (hyper)sphere
	// so the sum of the squares of the coordinates has to be 1
	let d = sqrt(1/dim);
	for (let i = 0; i < this.nVertices; ++i) {
	    let vertex = new Float64Array(dim);
	    for (let j = 0; j < dim; ++j) {
		// positive if i has a 1 bit in the jth position
		vertex[j] = ((i & (1<<j)? d : -d));
	    }
	    this.vertices.push(ndarray(vertex, [dim]));
	}
	for (let i = 0; i < (1 << dim); ++i) {
	    for (let j = 0; j < dim; ++j) {
		if ((i & (1 << j)) === 0) {
		    this.edges.push([i, i | (1 <<j)]);
		}		
	    }
	}
    }
}

/*
 * Kite (cross polytope)
 *	The vertices are at +-1 in each dimension;
 *	Each vertex is connected to all vertices off its own axis
 *      That's 2d * (2d - 2) /2 = 2d^2 - d
 */
export class kite extends polytope {
    constructor(dim) {
	super(dim, dim * 2, 2 * dim * (dim - 1));
	this.name = 'kite';
	// The easy thing is to do the vertices two at a time.
	for (let i = 0; i < dim; ++i) {
	    let v1=[];
	    let v2=[];
	    for (let j = 0; j < dim; ++j) {
		v1.push((i === j)? 1.0 : 0.0);
		v2.push((i === j)? -1.0 : 0.0);
	    }
	    this.vertices.push(ndarray(v1, [dim]));
	    this.vertices.push(ndarray(v2, [dim]));
	}
	// now the edges.
	//     The vertices for axis d are at 2d and 2d+1
	for (let i = 0; i < 2 * dim; i += 2) {
	    // for each vertex except the last, 
	    for (let j = i+2; j < 2 * dim ; ++j) {
		// connect it to all the later ones except the one on its axis
		this.edges.push([i, j]);
		this.edges.push([i+1, j]);
	    }		
	}
    }
}

/*
 * Simplex
 *	There are d+1 vertices.  d of the vertices are at +1 on each axis;
 *      the last is at [-x,...-x] with x = sqrt(1/dim); all vertices are
 *      on the unit hypersphere.
 */
export class simplex extends polytope {
    constructor(dim) {
	super(dim, dim + 1, (dim + 1) * dim / 2);
	this.name = 'simplex';
	for (let i = 0; i < dim; ++i) {
	    let vertex=[];
	    for (let j = 0; j < dim; ++j) {
		vertex.push((i === j)? 1.0 : 0.0);
	    }
	    this.vertices.push(ndarray(vertex, [dim]));
	}
	let x = sqrt(1.0/dim);
	let vertex=[];
	for (let i = 0; i < dim; ++i) {
	    vertex.push(x);
	}
	this.vertices.push(ndarray(vertex, [dim]));
	// now the edges.
	for (let i = 0; i < dim + 1; i++) {
	    // for each vertex except the last, 
	    for (let j = i+1; j < dim + 1; ++j) {
		// connect it to all the later ones
		this.edges.push([i, j]);
	    }		
	}
    }
}
