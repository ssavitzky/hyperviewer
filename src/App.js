import { version, Component } from 'inferno';
import './registerServiceWorker';
import {PI} from 'math';
import {polytopeFactory} from './polytopes';
import {transformStack, rotationState} from './transform-stack';
import './App.css';

var defaultDimensions = 4;
var defaultFigure = 1;

const DEGREES = PI/180;
const MAX_DIM = 6;
const MIN_DIM = 2;

/*
 * NOTE:  something goes weirdly wrong the second time we try to make a simplex
 *        _while the app is running_ -- nVertices and nEdges are wrong, and go
 *        wrong _while we are making the vertices_!.  I suspect that something
 *        isn't thread-safe, but it could also be due to our cavalier attitude
 *        toward rotations.
 *        Our hacky solution is simply to cache all the polytopes we're going to
 *        need, so that we don't have to do it twice.
 */
const polytopeFactories = [];
for (let n = MIN_DIM; n <= MAX_DIM; n++) {
    polytopeFactories.push(new polytopeFactory(n));
}

class App extends Component {
    constructor(props) {
	super(props);
	let dimensions = defaultDimensions;
	let rotationStates = [];
	/* 
	 * For now we just make a couple of random rotation states; 
	 */
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
	state.dimensions = dimensions;
	state.polytopeFactory = polytopeFactories[dimensions - MIN_DIM];
	state.figure = state.polytopeFactory.getPolytope(state.figureIndex);
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

    setDimensions(dimensions, oldstate) {
	let state = {...oldstate};
	state.dimensions = dimensions;
	state.polytopeFactory = polytopeFactories[dimensions - MIN_DIM];
	state.figureIndex = oldstate.figureIndex;
	state.figure = state.polytopeFactory.getPolytope(state.figureIndex);
	state.transforms = new transformStack(dimensions);
	for (let r of state.rotationStates) {
	    r.applyTo(state.transforms);
	}
	state.transform = state.transforms.getComposed();
	return state;
    }

    updateDimensions(dim) {
	this.setState((oldstate, props) => {
	    return this.setDimensions(dim, oldstate);
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
	    newState.figure = oldstate.polytopeFactory.getPolytope(newState.figureIndex);
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
		<h3>{`Welcome to Hyperspace Express Viewer on Inferno version ${version}`}</h3>
              </header>
	      this is a {state.dimensions.toString()}-dimensional { state.figure.name }
	      <br/>
	      <SelectDimensions value={state.dimensions} min={MIN_DIM} max={MAX_DIM}
				callback={this.handleDimensionChange}
				/>
	      <SelectFigure value={state.figureIndex} min="0" max="2"
		       callback={this.handleFigureChange}/>
	      <p>
		{ String(state.figure.nVertices) + " Vertices, " }
		{ figure.nEdges.toString() + " edges, " }
		{ state.cycles + " cycles, " }
		{ transforms.nTransforms() + " transforms " }
	      </p>
	      <Viewer viewSize={state.viewerSize} viewAngle={state.cameraAngle}
		      figure={state.figure} transforms={state.transforms} />
	    </div>
    );
  }
}

/// State Transformer Functions


/// Component functions:

function Viewer(props) {
    let size = props.viewSize;
    let figure = props.figure;
    let transformed = props.transforms.transformPoints(figure.vertices);
    let verts = props.transforms.getScreenPoints(transformed, props.viewAngle, size);
    if (figure.edges.length > figure.nEdges) {
	throw new Error("expect " + figure.nEdges + " but have " + figure.edges.length +
			" in " + figure.dimension + '-D ' + figure.name
		       );
    }
    return (
	<svg width={size} height={size}>
	  <circle cx={size/2} cy={size/2} r={3} fill="red" />
	  <g $HasKeyedChildren>
	  { figure.edges.map((edge, n) => {
	      let key = String(n) + ':[' + edge[0] + ',' + edge[1] + ']';
	      let from = verts[edge[0]];
	      let to = verts[edge[1]];
	      if (from === undefined || to === undefined) {
		  throw new Error("undef in edge " + key + figure.edges.length);
	      }
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
