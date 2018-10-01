import {PI} from 'math';
import {makeTransform, makePoint, compose, apply, map,
	identity, rotation,
       } from './transforms';

var ndarray = require("ndarray");

var dim = 4;
var point = ndarray([1.0, 2.0, 3.0, 4.0], [dim]);
var point1 = ndarray([5.0, 6.0, 7.0, 8.0], [dim]);
var dest = makePoint(dim);

it('makes an identity matrix that works correctly', () => {
    let theTransform = identity(makeTransform(dim));
    for (let i = 0; i < dim; ++i) {
	for (let j = 0; j < dim; ++j) {
	    expect(theTransform.get(i, j)).toBe((i == j)? 1 : 0);
	}
    }
    let dest = apply(makePoint(dim), theTransform, point);
    for (let i = 0; i < dim; i++) {
	expect(dest.get(i)).toBe(point.get(i));
    }
    dest = apply(undefined, theTransform, point);
    for (let i = 0; i < dim; i++) {
	expect(dest.get(i)).toBe(point.get(i));
    }
});

// floating point equality is approximate
function roughlyEqual(v1, v2) {
    return (v1 - v2)**2 < 1e-8;
}

it('makes a rotation matrix that works correctly', () => {
    let theTransform = makeTransform(dim);
    rotation(theTransform, 0, 1, PI/2);
    dest = apply(dest, theTransform, point);
    // a 90-degree rotation takes one axis into the other
    expect(roughlyEqual(dest.get(0),point.get(1))).toBeTrue;
    expect(roughlyEqual(dest.get(1),point.get(0))).toBeTrue;
    expect(dest.get(2)).toBe(point.get(2));
    expect(dest.get(3)).toBe(point.get(3));
});


it('composes rotations correctly', () => {
    let theTransform = makeTransform(dim);
    rotation(theTransform, 0, 1, PI/4);
    let composedWithItself = makeTransform(dim);
    compose(composedWithItself, theTransform, theTransform);
    dest = apply(dest, composedWithItself, point);
    // a 90-degree rotation takes one axis into the other
    expect(roughlyEqual(dest.get(0),point.get(1))).toBeTrue;
    expect(roughlyEqual(dest.get(1),point.get(0))).toBeTrue;
    expect(dest.get(2)).toBe(point.get(2));
    expect(dest.get(3)).toBe(point.get(3));
});

var points = [point, point1];

it('maps a transform down a list of points',  () => {
    let theTransform = makeTransform(dim);
    rotation(theTransform, 0, 1, PI/4);
    let dest = map(undefined, theTransform, points);
    expect(dest.length).toBe(2);
    
    let p0 = dest[0];
    let p1 = dest[1];
    dest = map(dest, theTransform, points);

    expect(roughlyEqual(dest[0].get(0),point.get(1))).toBeTrue;
    expect(roughlyEqual(dest[0].get(1),point.get(0))).toBeTrue;
    expect(dest[0].get(2)).toBe(point.get(2));
    expect(dest[0].get(3)).toBe(point.get(3));

    expect(roughlyEqual(dest[1].get(0),point1.get(1))).toBeTrue;
    expect(roughlyEqual(dest[1].get(1),point1.get(0))).toBeTrue;
    expect(dest[1].get(2)).toBe(point1.get(2));
    expect(dest[1].get(3)).toBe(point1.get(3));

    // we expect map to re-use the points in the destination list
    expect(dest[0]).toBe(p0);
    expect(dest[1]).toBe(p1);
});

