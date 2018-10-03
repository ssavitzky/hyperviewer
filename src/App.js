import { version, Component } from 'inferno';
import './registerServiceWorker';
import {PI} from 'math';
import {cube, kite, simplex} from './polytopes';
import {transformStack, rotationState} from './transform-stack';
import './transforms';
import './App.css';

var defaultDimensions = 4;
var defaultFigure = 1;

function makeFigure(dimensions, index) {
    let makers = [ (dim) => new kite(dim),
		   (dim) => new cube(dim),
		   (dim) => new simplex(dim)
		 ];
    return makers[index](dimensions);
}

const DEGREES = PI/180;

class App extends Component {
    constructor(props) {
	super(props);
	let dim = defaultDimensions;	// This all belongs in the state.
	this.state = {
	    dimensions: dim,
	    figureIndex: defaultFigure,
	    figure: makeFigure(dim, defaultFigure),
	    viewerSize: 500,
	    viewAngle: 20*DEGREES,
	    rotationStates: [],
	};
	/* A transformStack is basically just a way of memoizing the transform function */
	this.transforms = new transformStack(dim);

	this.state.rotationStates.push(new rotationState(0, 0, 2, 30*DEGREES, 2*DEGREES));
	this.state.rotationStates.push(new rotationState(1, 1, 3, 20*DEGREES, 2*DEGREES));
	this.state.rotationStates.push(new rotationState(2, 0, 3, 20*DEGREES, 2*DEGREES));
	for (let r of this.state.rotationStates) {
	    r.applyTo(this.transforms);
	}
	let xform = this.transforms.getComposed();
	this.state.figure.applyTransform(xform);
	this.state.figure.applyPerspective(this.state.viewAngle, this.state.viewerSize);
    }

    /* State updaters */

    updateDimensions(oldstate, props) {
	let newState = {...oldstate};
    }
    
    render() {
	return (
	    <div className="App">
              <header className="App-header">
		<h3>{`Welcome to Hyperspace Express viewer, Inferno version ${version}`}</h3>
              </header>
	      { "showing a " + this.state.dimensions.toString() + "-dimensional " + this.state.figure.name }
	      <br/>
	      <p> { this.state.figure.nVertices.toString() + " vertices, " }
	      { this.state.figure.transformed.length.toString() + " transformed, " }
	      { this.state.figure.screenPoints.length.toString() + " screen, " }
	      { this.state.figure.nEdges.toString() + " edges, " }
	      { this.state.figure.edges.length.toString() + " screen, " } </p>
	      <Viewer viewSize={this.state.viewerSize} viewAngle={this.cameraAngle}
		      figure={this.state.figure} transform={this.transforms.getComposed()} />
	    </div>
    );
  }
}

function showEdge(edge) {
    
}

function Viewer(props) {
    let size = props.viewSize;
    let fig = props.figure;
    let verts = fig.screenPoints;

    return (
	<svg width={size} height={size} >
	  {
	      fig.edges.map((edge, n) => {
		  return <Edge key={n.toString()} from={verts[edge[0]]} to={verts[edge[1]]} />;
	      })
	  }
	</svg>
    );

}

function Edge(props) {
    return (
	<line x1={props.from[0]} y1={props.from[1]}
	      x2={props.to[0]} y2={props.to[1]}
	      key={props.key}
	      stroke='green' strokeWidth='2'
	      />
    );
}

export default App;
