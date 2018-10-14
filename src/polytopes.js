import {sqrt} from 'math';
import {vector} from './transforms';

/*
 * This package lets us create and transform n-dimensional polytopes.
 */

const MIN_DIM = 2;
const MAX_DIM = 6;

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
class polytope {
    constructor(dim, nVertices, nEdges) {
	this.dimensions = dim;
	this.nVertices = nVertices;
	this.nEdges = nEdges;
	this.vertices = [];
	this.edges = [];
	this.faces = [];
	this.aka  = []; 	// other names for the figure
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
	this.aka.push('measure polytope');
	if (dim === 4) {
	    this.aka.push('hypercube');
	    this.aka.push('tesseract');
	} else if (dim === 2) {
	    this.aka.push('square');
	}
	// We want the vertices to land on the unit (hyper)sphere
	// so the sum of the squares of the coordinates has to be 1
	let d = sqrt(1/dim);
	for (let i = 0; i < this.nVertices; ++i) {
	    this.vertices.push(new vector(dim).fill((j) =>  (i & (1<<j)? d : -d)));
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
	this.aka  = [ 'cross polytope', 'kite' ];
	if (dim === 3) {
	    this.aka.push('octohedron');
	} else if (dim === 2) {
	    this.aka.push('square');
	}

	// The easy thing is to do the vertices two at a time.
	for (let i = 0; i < dim; ++i) {
	    this.vertices.push(new vector(dim).fill((j) =>(i === j)? 1.0 : 0.0));
	    this.vertices.push(new vector(dim).fill((j) =>(i === j)? -1.0 : 0.0));
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
 *      the last is at [-x,...-x] with x = -1/(1 + sqrt(1 + dim))
 *      (see mathoverflow.net/questions/38724/coordinates-of-vertices-of-regular-simplex)
 *      After that it has to be shifted to put the origin at the center, and scaled to be
 *      on the unit hypersphere.
 *
 * There is a mysterious bug:
 *       The _second_ time a simplex is created _while the app is
 *       running_, this.nVertice and this.nEdges are getting
 *       clobbered, _in the middle of the constructor_.  WTF?
 */
export class simplex extends polytope {
    constructor(dim) {
	super(dim, dim + 1, (dim + 1) * dim / 2);
	/* Note:  not extending polytope doesn't change anything */
	/*     ...nor does changing the class name in case there was a name conflict. */
	this.name = 'simplex';
	if (dim === 3) {
	    this.aka.push('tetrahedron');
	} else if (dim === 2) {
	    this.aka.push('triangle');
	}
	let vertices = [];
	/* something goes massively wrong, right here. */
	if (this.nVertices !== (dim + 1) || this.nEdges !== ((dim + 1) * dim / 2) ||
	    this.vertices.length !== 0 || this.edges.length !== 0 ) {
	    throw new Error("nEdges = " + this.nEdges + " want " +  ((dim + 1) * dim / 2) +
			    "; nVertices = " + this.nVertices + " want " + dim +
			    "; vertices.length = " + this.vertices.length +
			    ' at this point in the initialization, where dim = ' + dim +
			    " in " + this.dimensions + '-D ' + this.name 
			   );
	} 
	for (let i = 0; i < dim; ++i) {
	    vertices.push(new vector(dim).fill((j) => i === j? 1.0 : 0));
	}

	let x = - sqrt(1.0/dim); // correct value is: - 1/(1 + sqrt(1 + dim));
	// after that it has to be shifted so that it's centered on the origin,
	// and then scaled until all the vertices are on the unit sphere.
	vertices.push(new vector(dim).fill((i) => x));
	this.vertices = vertices;
	this.nVertices = vertices.length;  // setting this to dim+1 FAILS:
	// in other words, this.nVertices is getting changed between these two statements!
	if (this.vertices.length !== this.nVertices || this.edges.length !== 0) {
	    throw new Error("expect " + this.nVertices + " verts, have " + this.vertices.length +
			    " in " + this.dimensions + '-D ' + this.name +
			    "; want " + this.nEdges + " edges into " + this.edges.length
			   );
	}
	// now the edges.
	let edges = [];
	for (let i = 0; i < dim + 1; i++) {
	    // for each vertex except the last, 
	    for (let j = i+1; j < dim + 1; ++j) {
		// connect it to all the later ones
		edges.push([i, j]);
	    }		
	}
	this.edges = edges;
	this.nEdges = edges.length;
	if (this.edges.length > this.nEdges) {
	    throw new Error("expect " + this.nEdges + " but have " + this.edges.length +
			    " in " + this.dimensions + '-D ' + this.name + ' with ' +
			    this.vertices.length + ' vertices, expecting ' + this.nVertices
			   );
	}
    }
}


/*
 * This makes a list of the polytopes for a given dimension.
 */
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

    getPolytopes() {
	return this.polytopes;
    }
}

const polytopeFactories = [];
for (let n = MIN_DIM; n <= MAX_DIM; n++) {
    polytopeFactories.push(new polytopeFactory(n));
}
function getPolytopeFactory(dim) {
    return polytopeFactories[dim - MIN_DIM];
}
export function getPolytopesFor(dimension) {
    //return getPolytopeFactory(dimension).polytopes;
    return polytopeFactories[dimension - MIN_DIM].polytopes;
}

