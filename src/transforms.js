import {sin, cos} from 'math';

/*
 * This package creates, composes, and applies linear transforms.
 */

/*
 * matrix(rows, cols) constructs a rows * cols matrix.
 */
export class matrix {
    constructor(rows, cols) {
	this.shape = [rows, cols];
	this.nRows = rows;
	this.nColumns = cols;
	this.rows = [];		// each row is a Float64Array of column values
	for (let i = 0; i < this.nRows; ++i) {
	    this.rows.push(new Float64Array(this.nColumns));
	}
    }

    fill(f) {
	for (let r = 0; r < this.nRows; ++r) {
	    for (let c = 0; c < this.nColumns; ++c) {
		this.rows[r][c] = f(r, c);
	    }
	}
	return this;		
    }

    get(r, c) {
	return this.rows[r][c];
    }

    toString() {
	let shape = this.shape;
	let s = "[";
	for (let x = 0; x  < shape[0]; ++x) {
	    s += "[";
	    for (let y = 0; y < shape[1]; ++y) {
		s += String(this.get(x, y));
		s += (y === shape[1] - 1)? "" : ", ";
	    }
	    s += "]";
	}
	s += "]";
	return s;
    }

    /*
     * Multiply A=this (on the left) with B (on the right) and put the result in dest.
     *
     * Multiplication of two matrices is defined if and only if the
     * number of columns of the left matrix is the same as the number
     * of rows of the right matrix.
     */
    compose(right, dest) {
	/* 
	 * If A is an m-by-n matrix and B is an n-by-p matrix, then
	 * their matrix product AB is the m-by-p matrix whose entries
	 * are given by dot product of the corresponding row of A and
	 * the corresponding column of B:
	 */
	//assert(this.nRows === right.nColumns);
	for (let r = 0; r < this.nRows; ++r) { // A row = destination row
	    for (let c = 0; c < dest.nColumns; ++c) { // C column = destnation column
		let sum = 0;
		for (let p = 0; p < this.nColumns; ++p) {
		    sum += this.get(r, p) * right.get(c, p);
		}
		dest.rows[r][c] = sum;
	    }
	}
	return dest;
    }

    /*
     * This computes the matrix product Mv, with v considered to be a
     * column vector, and the destination considered to be a row vector.
     */
    transform(right, dest) {
	// destination rows == 1
	for (let c = 0; c < this.nColumns; ++c) { // destnation row
	    let sum = 0;
	    for (let p = 0; p < this.nRows; ++p) {
		sum += this.get(c, p) * right.get(p);
	    }
	    dest.values[c] = sum;
	}
	return dest;
    }
}


/*
 * A vector is not a matrix.
 */
export class vector {
    constructor(dimensions, f) {
	this.shape = [ dimensions ];
	this.dimensions = dimensions;
	this.size = dimensions;	      // for ndarray compatibility
	this.values = new Float64Array(this.dimensions);
	if (f) {
	    this.fill(f);
	}
    }

    fill(f) {
	for (let c = 0; c < this.dimensions; ++c) {
	    this.values[c] = f(c);
	}
	return this;		
    }
    
    get(n) {
	return this.values[n];
    }
    
    put(n, v) {
	 this.values[n] = v;
    }
    
}

export function makeTransform(dim) {
    return new matrix(dim, dim);
}
export function makePoint(dim, list) {
    let v = new vector(dim);
    if (list !== undefined) {
	v.fill((i) => list[i]);
    }
    return v;
}

/// Identity:

/*
 * initialize a square matrix, dest, to an identity transform.
 */
export function identity(dest) {
    dest.fill((i, j) => {
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
    dest.fill((i, j) => rotationFill(i, j, x1, x2, sin(theta), cos(theta)));
    return dest;
}

/*
 * Initialize a square matrix, dest, to a rotation transform, using the sine and
 * cosine of the rotation angle.  This should be used with a precomputed table of
 * sines and cosines.
 */
export function rotation2(dest, x1, x2, sinTheta, cosTheta) {
    dest.fill((i, j) => rotationFill(i, j, x1, x2, sinTheta, cosTheta));
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

/// nvarray compatibility functions

/// Composing transforms

export function gemm(dest, t1, t2) {
    return t1.compose(t2, dest);
}

/// Applying transforms

export function fill(matrix, f) {
    return matrix.fill(f);
}

/*
 * Transform a point
 */
export function apply(dest, transform, point) {
    if (dest === undefined) {
	dest = new vector(point.size);
    }
    return transform.transform(point, dest);
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
	    dest.push(new vector(dim));
	}
    }
    for (let i = 0; i < points.length; ++i) {
	transform.transform(points[i], dest[i]);
    }
    return dest;
}

export function transformToString(transform) {
    return transform.toString();
}
