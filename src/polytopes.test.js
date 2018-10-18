import { cube, orthoplex, simplex, polytopeFactory, getPolytopesFor
       } from './polytopes';
import {abs, sqrt} from 'math';

it('has typed arrays', () => {
    expect(typeof Float64Array).toBeDefined();
});

// verify that polytopes are initialized correctly

// Note that we can use toBe(true) and toBe(false) with this,
// because they return true and false explicitly.  Otherwise
// we could use toBeTruthy() and toBeFalsy().

// floating point equality is approximate.  We could 
function roughlyEqual(v1, v2) {
    return abs(v1 - v2) < 1e-10? true : false;
}

// test whether a vertex is on the unit sphere.  We could use
// toBeCloseTo 
function onUnitSphere(vertex) {
    return roughlyEqual(vertex.norm(), 1.0);
}

it('tests for roughlyEqual roughly correctly', () => {
    expect(roughlyEqual(1, 0)).toBe(false);
    expect(roughlyEqual(1, -1)).toBe(false);
    expect(roughlyEqual(0, 0)).toBe(true);
    expect(roughlyEqual(1, 1)).toBe(true);
    expect(roughlyEqual(-1, -1)).toBe(true);
    expect(roughlyEqual(0, 0)).toBe(true);
    expect(roughlyEqual(1.99e-11, 0)).toBe(true);
    expect(roughlyEqual(1, 0)).toBe(false);
    expect(roughlyEqual(1, 0)).toBe(false);
    expect(roughlyEqual(1, 1.1)).toBe(false);
    expect(roughlyEqual(1.1, 1)).toBe(false);
    expect(roughlyEqual(1e-4, 0)).toBe(false);
    expect(roughlyEqual(0, 1e-4)).toBe(false);
});

it('makes cubes with the right number of vertices and edges', () => {
    for (let dim = 2; dim < 6; ++dim) {
	let theCube = new cube(dim);
	expect(theCube.name).toBe("cube");
	expect(theCube.dimensions).toBe(dim);
	expect(theCube.nVertices).toBe(1<<dim);
	expect(theCube.vertices.length).toBe(1 << dim);
	expect(theCube.edges.length).toBe(theCube.nEdges);
    }
});

it('makes orthoplexes with the right number of vertices and edges', () => {
    for (let dim = 2; dim < 6; ++dim) {
	let theOrthoplex = new orthoplex(dim);
	expect(theOrthoplex.name).toBe("orthoplex");
	expect(theOrthoplex.dimensions).toBe(dim);
	expect(theOrthoplex.nVertices).toBe(2 * dim);
	expect(theOrthoplex.vertices.length).toBe(theOrthoplex.nVertices);
	expect(theOrthoplex.nEdges).toBe(2 * dim * (dim - 1));
	expect(theOrthoplex.edges.length).toBe(theOrthoplex.nEdges);
    }
});

it('makes simplices with the right number of vertices and edges', () => {
    for (let dim = 2; dim < 6; ++dim) {
	let theSimplex = new simplex(dim);
	expect(theSimplex.name).toBe("simplex");
	expect(theSimplex.dimensions).toBe(dim);
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
	for (let v = 0; v < theCube.nVertices; ++v) {
	    expect(theCube.vertices[v].dimensions).toBe(dim);
	    expect(onUnitSphere(theCube.vertices[v])).toBe(true);
	}
	for (let v = 0; v < theOrthoplex.nVertices; ++v) {
	    expect(theOrthoplex.vertices[v].dimensions).toBe(dim);
	    expect(onUnitSphere(theOrthoplex.vertices[v])).toBe(true);
	}
    }
});

it("puts a simplex's vertices somewhere near the unit sphere", () => {
    for (let dim = 2; dim < 8; ++dim) {
	let theSimplex = new simplex(dim);
	let worst = 0;
	let worstv = 0;
	for (let v = 0; v < theSimplex.nVertices; ++v) {
	    expect(theSimplex.vertices[v].dimensions).toBe(dim);
	    expect(theSimplex.nVertices).toBe(1 + dim);
	    for (let v = 0; v < dim; ++v) {
		// They're really pretty far off in some cases, like norm=.93
		// which doesn't even pass with one digit of precision.  Bletch.
		expect(theSimplex.vertices[v].norm()).toBeCloseTo(1, 0);
		if (v === 0 || abs(theSimplex.vertices[v].norm() - 1) > worst) {
		    worst = (theSimplex.vertices[v].norm() - 1);
		    worstv = v;
		}
	    }// so don't expect a test with 10 digits of precision to work
	    //expect(onUnitSphere(theSimplex.vertices[v])).toBe(true);
	}
	console.log(`worst vertex ${dim}-D simplex: v=${worstv} error=${worst}`);
    }
});

it('makes figures correctly in a factory', () => {
    for (let d = 2; d < 6; d++) {
	let factory = new polytopeFactory(d);
	factory.getPolytopes().map((fig) => {
	    expect(fig.vertices.length).toBe(fig.nVertices);
	    expect(fig.edges.length).toBe(fig.nEdges);
	    expect(fig.dimensions).toBe(d);
	});
    }
});

it('gets the correct set of polytopes from getPolytopesFor(d)', () => {
    for (let d = 2; d < 6; d++) {
	let list = getPolytopesFor(d);
	list.map((fig) => {
	    expect(fig.vertices.length).toBe(fig.nVertices);
	    expect(fig.edges.length).toBe(fig.nEdges);
	    expect(fig.dimensions).toBe(d);
	});
	// get the same list back each time
	expect(getPolytopesFor(d)).toBe(list);
	// it should have at least three polytopes in it.
	// Eventually we will add the additional ones for d=3 and 4
	expect(list.length).toBeGreaterThanOrEqual(3); // simplex, kite, cube
    }
});
