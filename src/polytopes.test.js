import { cube, orthoplex, simplex, polytopeFactory } from './polytopes';

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
    let norm = 0.0;
    for (let j = 0; j < vertex.size; j++) {
	norm += vertex.get(j) ** 2;
    }
    return roughlyEqual(norm, 1);
} 

it('makes cubes with the right number of vertices and edges', () => {
    for (let dim = 2; dim < 6; ++dim) {
	let theCube = new cube(dim);
	expect(theCube.dimension).toBe(dim);
	expect(theCube.nVertices).toBe(1<<dim);
	expect(theCube.vertices.length).toBe(1 << dim);
	expect(theCube.edges.length).toBe(theCube.nEdges);
    }
});

it('makes orthoplexs with the right number of vertices and edges', () => {
    for (let dim = 2; dim < 6; ++dim) {
	let theOrthoplex = new orthoplex(dim);
	expect(theOrthoplex.dimension).toBe(dim);
	expect(theOrthoplex.nVertices).toBe(2 * dim);
	expect(theOrthoplex.vertices.length).toBe(theOrthoplex.nVertices);
	expect(theOrthoplex.nEdges).toBe(2 * dim * (dim - 1));
	expect(theOrthoplex.edges.length).toBe(theOrthoplex.nEdges);
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
	let theOrthoplex = new orthoplex(dim);
	let theSimplex = new simplex(dim);
	for (let v = 0; v < theCube.nVertices; ++v) {
	    expect(onUnitSphere(theCube.vertices[v])).toBeTrue;
	}
	for (let v = 0; v < theOrthoplex.nVertices; ++v) {
	    expect(onUnitSphere(theOrthoplex.vertices[v])).toBeTrue;
	}
	for (let v = 0; v < theSimplex.nVertices; ++v) {
	    expect(onUnitSphere(theSimplex.vertices[v])).toBeTrue;
	}
    }
});

it('makes figures correctly', () => {
    for (let d = 2; d < 4; d++) {
	let factory = new polytopeFactory(d);
	for (let f = 0; f < 3; f++) {
	    let fig = factory.getPolytope(f);
	    expect(fig.vertices.length).toBe(fig.nVertices);
	    expect(fig.edges.length).toBe(fig.nEdges);
	}
	for (let f = 0; f < 3; f++) {
	    let fig = factory.getPolytope(f);
	    expect(fig.vertices.length).toBe(fig.nVertices);
	    expect(fig.edges.length).toBe(fig.nEdges);
	}
    }
    for (let d = 2; d < 4; d++) {
	let factory = new polytopeFactory(d);
	for (let f = 0; f < 3; f++) {
	    let fig = factory.getPolytope(f);
	    expect(fig.vertices.length).toBe(fig.nVertices);
	    expect(fig.edges.length).toBe(fig.nEdges);
	}
    }
});
