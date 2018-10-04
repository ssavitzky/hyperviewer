import { cube, kite, simplex } from './polytopes';

it('has typed arrays', () => {
    expect((typeof Float64Array).toBeDefined);
});

// verify that polytopes are initialized correctly

// floating point equality is approximate
function roughlyEqual(v1, v2) {
    return (v1 - v2)**2 < 1e-10;
}

// test whether a vertex is on the unit sphere
function onUnitSphere(vertex) {
    norm = 0.0;
    for (let j = 0; j < vertex.size; j++) {
	norm += vertex.get(j) ** 2;
    }
    return roughlyEqual(norm, 1);
} 

it('makes cubes with the right number of vertices and edges', () => {
    for (let dim = 2; dim < 5; ++dim) {
	let theCube = new cube(dim);
	expect(theCube.dimension).toBe(dim);
	expect(theCube.nVertices).toBe(1<<dim);
	expect(theCube.vertices.length).toBe(1 << dim);
	expect(theCube.edges.length).toBe(theCube.nEdges);
    }
});

it('makes kites with the right number of vertices and edges', () => {
    for (let dim = 3; dim < 6; ++dim) {
	let theKite = new kite(dim);
	expect(theKite.dimension).toBe(dim);
	expect(theKite.nVertices).toBe(2 * dim);
	expect(theKite.vertices.length).toBe(theKite.nVertices);
	expect(theKite.nEdges).toBe(2 * dim * (dim - 1));
	expect(theKite.edges.length).toBe(theKite.nEdges);
    }
});

it('makes simplices with the right number of vertices and edges', () => {
    for (let dim = 2; dim < 6; ++dim) {
	let theSimplex = new simplex(dim);
	expect(theSimplex.dimension).toBe(dim);
	expect(theSimplex.nVertices).toBe(1 + dim);
	expect(theSimplex.nEdges).toBe((dim + 1) * dim / 2);
	expect(theSimplex.vertices.length).toBe(theSimplex.nVertices);
	expect(theSimplex.edges.length).toBe(theSimplex.nEdges);
    }
});

it('puts vertices on the unit sphere', () => {
    for (let dim = 2; dim < 6; ++dim) {
	let theCube = new cube(dim);
	let theKite = new kite(dim);
	let theSimplex = new simplex(dim);
	for (let v = 0; v < theCube.vertices; ++v) {
	    expect(onUnitSphere(theCube.vertices[v])).toBeTrue;
	}
	for (let v = 0; v < theKite.vertices; ++v) {
	    expect(onUnitSphere(theKite.vertices[v])).toBeTrue;
	}
	for (let v = 0; v < theSimplex.vertices; ++v) {
	    expect(onUnitSphere(theSimplex.vertices[v])).toBeTrue;
	}
    }
});
