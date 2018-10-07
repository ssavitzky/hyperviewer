import { version, Component } from 'inferno';
import './registerServiceWorker';
import {PI} from 'math';
import {cube, kite, simplex} from './polytopes';
import {transformStack, rotationState} from './transform-stack';
import './App.css';

var defaultDimensions = 4;
var defaultFigure = 2;

function makeFigure(dimensions, index) {
    let makers = [ (dim) => new simplex(dim),
		   (dim) => new kite(dim),
		   (dim) => new cube(dim),
		 ];
    return makers[index](dimensions);
}

const DEGREES = PI/180;

class App extends Component {
    constructor(props) {
	super(props);
	let dimensions = defaultDimensions;
	let rotationStates = [];
	rotationStates.push(new rotationState(0, 0, 1, 30*DEGREES, 1*DEGREES));
	rotationStates.push(new rotationState(1, 0, 2, 30*DEGREES, 1*DEGREES));
	rotationStates.push(new rotationState(2, 1, 3, 20*DEGREES, 1*DEGREES));
	rotationStates.push(new rotationState(3, 0, 3, 20*DEGREES, 1*DEGREES));
	let state = {
	    dimensions: dimensions,
	    figureIndex: defaultFigure,
	    viewerSize: 500,
	    viewAngle: 60*DEGREES,
	    rotationStates: rotationStates,
	    cycles: 0,
	};
	state.figure = makeFigure(dimensions, state.figureIndex);
	state.transforms = new transformStack(dimensions);
	for (let r of state.rotationStates) {
	    r.applyTo(state.transforms);
	}
	state.transform = state.transforms.getComposed();
	this.state = state;
    }
    
    componentDidMount() {
	this.timeID = setInterval( () => this.handleTimer(), 100 );
    }

    componentWillUnmount() {
	clearInterval(this.timerID);
    }

    handleTimer() {
	this.setState(this.rotate);
    }

    /* State updaters */

    rotate = (oldstate, props) => {
	let newstate = {...oldstate};
	newstate.rotationStates = oldstate.rotationStates.map((state) => state.tick());
	++ newstate.cycles;
	newstate.transforms = new transformStack(newstate.dimensions);
	for (let r of newstate.rotationStates) {
	    r.applyTo(newstate.transforms);
	}
	newstate.transform = newstate.transforms.getComposed();
	return newstate;
    }
    
    updateDimensions(dim) {
	this.setState((oldstate, props) => {
	    return setDimensions(dim, oldstate);
	});
    }

    handleDimensionChange = (event) => this.updateDimensions(event.target.value);

    updateFigure(index) {
	if (index < 0 || index > 2) {
	    return;
	}
	this.setState((oldstate, props) => {
	    let newState = {...oldstate};
	    newState.figureIndex = index;
	    newState.figure = makeFigure(oldstate.dimensions, newState.figureIndex);
	    return newState;
	});
    }
    handleFigureChange = (event) => this.updateFigure(event.target.value);
    
    render() {
	let state=(this.state);
	let size = state.viewerSize;
	let figure = state.figure;
	let transforms = new transformStack(state.dimensions);
	for (let r of state.rotationStates) {
	    r.applyTo(transforms);
	}
	let transformed = transforms.transformPoints(figure.vertices);
	let verts = transforms.getScreenPoints(transformed, state.viewAngle, size);
	return (
	    <div className="App">
              <header className="App-header">
		<h3>{`Welcome to Hyperspace Express viewer, Inferno version ${version}`}</h3>
              </header>
	      "showing a " {state.dimensions.toString()} "-dimensional "
		  { state.figure.name }
	      <br/>
	      <SelectDimensions value={state.dimensions} min="2" max="6"
				callback={this.handleDimensionChange}
				/>
	      <SelectFigure value={state.figureIndex} min="0" max="2"
		       callback={this.handleFigureChange}/>
	      <p>
		{ String(state.figure.nVertices) + " Vertices, " }
		{ "(screen "  + String(verts.length) + ") " }
		{ figure.nEdges.toString() + " edges, " }
		{ figure.edges.length.toString() + " screen, " }
		{ state.cycles + " cycles, " }
		{ transforms.nTransforms() + " transforms " }
		{ transforms.modifiedFrom }
	      </p>
	<svg width={size} height={size}>
	  <circle cx={size/2} cy={size/2} r={3} fill="red" />
	  <g $HasKeyedChildren>
	  { figure.edges.map((edge, n) => {
	      let key = String(n) + ':[' + edge[0] + ',' + edge[1] + ']';
	      let from = verts[edge[0]];
	      let to = verts[edge[1]];
	      return <line key={key} stroke='green' strokeWidth='2'
			       x1={from[0]} y1={from[1]}
			       x2={to[0]} y2={to[1]} />;
	      })
	  }
	  </g>
	</svg>
	{ /* <Viewer viewSize={state.viewerSize} viewAngle={this.cameraAngle}
		    figure={state.figure} transforms={this.transforms} />  */}
	    </div>
    );
  }
}

/// State Transformer Functions

function  setDimensions(dimensions, oldstate) {
    let state = {...oldstate};
    state.dimensions = dimensions;
    state.figureIndex = oldstate.figureIndex;
    state.figure = makeFigure(dimensions, state.figureIndex);
    state.transforms = new transformStack(dimensions);
    for (let r of state.rotationStates) {
	r.applyTo(state.transforms);
    }
    state.transform = state.transforms.getComposed();
    return state;
}

/// Component functions:

function Viewer(props) {
    let size = props.viewSize;
    let fig = props.figure;
    let transformed = props.transforms.transformPoints(fig.vertices);
    let verts = props.transforms.getScreenPoints(transformed, props.viewAngle, size);
    return (
	<svg width={size} height={size}>
	  <circle cx={size/2} cy={size/2} r={3} fill="red" />
	  <g $HasKeyedChildren>
	  { fig.edges.map((edge, n) => {
	      let key = String(n) + ':[' + edge[0] + ',' + edge[1] + ']';
	      let from = verts[edge[0]];
	      let to = verts[edge[1]];
	      return <line key={key} stroke='green' strokeWidth='2'
			       x1={from[0]} y1={from[1]}
			       x2={to[0]} y2={to[1]} />;
	      })
	  }
	  </g>
	</svg>
    );
}

function SelectDimensions(props) {
    return (
	<input type="range" value={props.value} min={props.min} max={props.max}
	       onInput={props.callback}
	       />
    );
}

function SelectFigure(props) {
    return (
	<input type="range" value={props.value}  min={props.min} max={props.max}
	       onInput={props.callback}
	       />
    );
}

export default App;
