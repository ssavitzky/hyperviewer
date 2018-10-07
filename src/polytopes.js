import {sqrt} from 'math';
import {makePoint} from './transforms';

/*
 * This package lets us create and transform n-dimensional polytopes.
 */

/* 
 * Polytope.  
 *   .vertices is the list of vertices, in the form of vectors.
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
	return this;
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
	    this.vertices.push(makePoint(dim, vertex));
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
 * Orthoplex (cross polytope; kite)
 *	The vertices are at +-1 in each dimension;
 *	Each vertex is connected to all vertices off its own axis
 *      That's 2d * (2d - 2) /2 = 2d^2 - d
 */
export class orthoplex extends polytope {
    constructor(dim) {
	super(dim, dim * 2, 2 * dim * (dim - 1));
	this.name = 'orthoplex';
	// The easy thing is to do the vertices two at a time.
	for (let i = 0; i < dim; ++i) {
	    let v1=[];
	    let v2=[];
	    for (let j = 0; j < dim; ++j) {
		v1.push((i === j)? 1.0 : 0.0);
		v2.push((i === j)? -1.0 : 0.0);
	    }
	    this.vertices.push(makePoint(dim, v1));
	    this.vertices.push(makePoint(dim, v2));
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
	
	if (this.dimension !== dim || this.vertices.length !== 0 || this.edges.length !== 0) {
	    throw new Error("want " + this.nEdges + " edges into " + this.edges.length +
			    "; want " + this.nVertices + " verts into " + this.vertices.length +
			    " in " + this.dimension + '-D ' + this.name
			   );
	}
	if (this.nVertices !== (dim + 1) || this.nEdges !== ((dim + 1) * dim / 2)) {
	    throw new Error("nEdges = " + this.nEdges + " want " +  ((dim + 1) * dim / 2) +
			    "; nVertices = " + this.nVertices + " want " + (dim + 1) +
			    " in " + this.dimension + '-D ' + this.name
			   );
	}
	for (let i = 0; i < dim; ++i) {
	    let vertex=[];
	    for (let j = 0; j < dim; ++j) {
		vertex.push((i === j)? 1.0 : 0.0);
	    }
	    this.vertices.push(makePoint(dim, vertex));
	}
	if (this.nVertices !== (dim + 1) || this.nEdges !== ((dim + 1) * dim / 2) ||
	    this.vertices.length !== dim || this.edges.length !== 0 ) {
	    throw new Error("nEdges = " + this.nEdges + " want " +  ((dim + 1) * dim / 2) +
			    "; nVertices = " + this.nVertices + " want " + dim +
			    "; vertices.length = " + this.vertices.length +
			    ' at this point in the initialization, where dim = ' + dim +
			    " in " + this.dimension + '-D ' + this.name
			   );
	}
	let x = - sqrt(1.0/dim);
	let vertex=[];
	for (let i = 0; i < dim; ++i) {
	    vertex.push(x);
	}
	this.vertices.push(makePoint(dim, vertex));
	if (this.vertices.length !== this.nVertices || this.edges.length !== 0) {
	    // something goes massively wrong, right here.
	    throw new Error("expect " + this.nVertices + " verts, have " + this.vertices.length +
			    " in " + this.dimension + '-D ' + this.name +
			    "; want " + this.nEdges + " edges into " + this.edges.length
			   );
	}
	// now the edges.
	for (let i = 0; i < dim + 1; i++) {
	    // for each vertex except the last, 
	    for (let j = i+1; j < dim + 1; ++j) {
		// connect it to all the later ones
		this.edges.push([i, j]);
	    }		
	}
	if (this.edges.length > this.nEdges) {
	    throw new Error("expect " + this.nEdges + " but have " + this.edges.length +
			    " in " + this.dimension + '-D ' + this.name + ' with ' +
			    this.vertices.length + ' vertices, expecting ' + this.nVertices
			   );
	}
    }
}

export class polytopeFactory {
    constructor(dim) {
	this.dimensions = dim;
	this.polytopes = [];
	// Create the usual suspects
	this.polytopes.push(new simplex(dim));
	this.polytopes.push(new orthoplex(dim));
	this.polytopes.push(new cube(dim));
    }

    getPolytope(n) {
	return this.polytopes[n];
    }
}
