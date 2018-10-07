import {PI} from 'math';
import {transformStack, rotationState} from './transform-stack';
import {makeTransform, makePoint, compose, apply, map,
        identity, rotation,
       } from './transforms';

var dim = 4;

function isIdentity(dim, xform) {
    for (let i = 0; i < dim; ++i) {
	for (let j = 0; j < dim; ++j) {
	    let v = xform.get(i, j);
	    if (i === j && v !== 1) {
		return false;
	    } else if (i !== j && v !== 0) {
		return false;
	    }		
	}
    }
    return true;
}

it('can addTransform() correctly twice', () => {
    let theStack = new transformStack(dim);
    expect(theStack.nTransforms()).toBe(0);

    let s = theStack.addTransform();

    expect(s).toBe(theStack);
    expect(s.nTransforms()).toBe(1);
    expect(isIdentity(dim, s.stack[0], dim)).toBeTrue;

    s = s.addTransform(identity(makeTransform(dim)));
    expect(s).toBe(theStack);
    expect(s.nTransforms()).toBe(2);
    expect(isIdentity(dim, s.stack[1], dim)).toBeTrue;

    expect(s.modifiedFrom).toBe(0);

    let comp = s.getComposed();
    expect(s.modifiedFrom).toBe(2);
    expect(s.temps.length).toBe(2);
    expect(isIdentity(dim, comp)).toBeTrue;
});


it('can modifyTransform', () => {
    let theStack = new transformStack(dim);
    let s = theStack.setRotation(0, 0, 1, PI/2);
    expect(s.nTransforms()).toBe(1);
    s = s.setRotation(0, 0, 1, -PI/2);
    expect(s.nTransforms()).toBe(1);
    expect(s.modifiedFrom).toBe(0);
    s = s.setRotation(1, 0, 1, PI/2);
    expect(s.nTransforms()).toBe(2);
    s = s.setRotation(1, 0, 1, -PI/2);
    expect(s.modifiedFrom).toBe(0);
});

it('can setRotation', () => {
    let theStack = new transformStack(dim);
    let s = theStack.setRotation(0, 0, 1, PI/2);
    expect(s.nTransforms()).toBe(1);
    s = s.setRotation(0, 0, 1, -PI/2);
    expect(s.nTransforms()).toBe(1);
    expect(s.modifiedFrom).toBe(0);
    s = s.setRotation(1, 0, 1, PI/2);
    expect(s.nTransforms()).toBe(2);
    s = s.setRotation(1, 0, 1, -PI/2);
    expect(s.modifiedFrom).toBe(0);
});
