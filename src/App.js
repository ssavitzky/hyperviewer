import { version, Component } from 'inferno';
import './registerServiceWorker';
import {PI} from 'math';
import {getPolytopesFor, simplex} from './polytopes';
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
 *        toward rotations, or a JavaScript scoping insanity.
 *        note that it's only the simplex -- cube works fine.
 *        Our hacky solution is simply to cache all the polytopes we're going to
 *        need, so that we don't have to do it twice.
 */
const BUG = false; //true;
   
class App extends Component {
    constructor(props) {
	super(props);
	let dimensions = defaultDimensions;
	let rotationStates = [];
	/* 
	 * For now we just make a couple of random rotation states; 
	 */
	rotationStates.push(new rotationState(0, 0, 1, 30*DEGREES, 1*DEGREES));
	rotationStates.push(new rotationState(1, 0, 2, 30*DEGREES, 1.1*DEGREES));
	rotationStates.push(new rotationState(2, 1, 2, 30*DEGREES, 1*DEGREES));
	rotationStates.push(new rotationState(3, 1, 3, 20*DEGREES, 1*DEGREES));
	rotationStates.push(new rotationState(4, 0, 3, 20*DEGREES, 1*DEGREES));
	rotationStates.push(new rotationState(5, 3, 4, 20*DEGREES, .2*DEGREES));

	let state = this.setDimensions(dimensions, {
	    dimensions: dimensions,
	    figureIndex: defaultFigure,
	    viewerSize: 500,
	    viewAngle: 30*DEGREES,
	    rotationStates: rotationStates,
	    cycles: 0,
	    
	});
	this.state = state;
    }
    
    setDimensions = (dimensions, oldstate) => {
	let state = {...oldstate};
	state.polytopeList = getPolytopesFor(dimensions);
	state.figure = state.polytopeList[state.figureIndex];
	state.dimensions = dimensions;
	if (BUG) { new simplex(dimensions); }
	// calling new simplex(dimensions) fails with the edge bug,
	return state;
    }

    updateDimensions = (dimensions) => {
	this.setState((oldstate, props) => {
	    return this.setDimensions(dimensions, oldstate);
	});
    }
    handleDimensionChange = (event) => this.updateDimensions(event.target.value);

    updateFigure(index) {
	this.setState((oldstate, props) => {
	    let state = {...oldstate};
	    state.figureIndex = index;
	    state.figure = state.polytopeList[state.figureIndex];
	    return state;
	});
    }
    handleFigureChange = (event) => this.updateFigure(event.target.value);

    updateViewAngle(angle) {
	this.setState((oldstate, props) => {
	    let state = {...oldstate};
	    state.viewAngle = angle * DEGREES;
	    return state;
	});
    }
    handleViewAngle = (event) => this.updateViewAngle(event.target.value);
    
    render() {
	let state=(this.state);
	let figure = state.figure;
	let otherNames = figure.aka.length > 0
	    ? ' (' + figure.aka.join(', ') + ')'
	    : '';
	return (
	    <div className="App">
              <header className="App-header">
		<h3>Hyperspace Viewer</h3>
              </header>
	      <SelectDimensions value={state.dimensions} min={MIN_DIM} max={MAX_DIM}
				callback={this.handleDimensionChange}
				 />
	      <SelectFigure value={state.figureIndex} list={state.polytopeList}
		            callback={this.handleFigureChange}/>
	      <SetViewAngle value={state.viewAngle / DEGREES} min={0} max={90}
		            callback={this.handleViewAngle}/>
	      <p> A {state.dimensions}-D { state.figure.name } { otherNames }
		{ ' has ' /* JSX deletes newlines without converting them to spaces*/ }
		{ state.figure.nVertices + ' vertices' } and { figure.nEdges + ' edges'}.
	      </p>
	      <div> {/* needed because the Viewer has a key */}
		<Viewer viewSize={state.viewerSize} viewAngle={state.viewAngle}
			figure={state.figure} rotationStates={state.rotationStates}
			key={figure.name + figure.dimensions + state.viewAngle}
			/>
	      </div>
              <footer>
		Built on <a href="https://infernojs.org">Inferno</a> v{version}
		--
		Code on <a href='https://github.com/ssavitzky/hyperviewer'>GitHub</a>
	      </footer>
	    </div>
    );
  }
}

/// Component functions:

// The viewer almost certainly wants to be a class; the problem is that the
// SelectFigure options flicker.  Presumably this is because it keeps getting
// re-rendered.  Moving the rotation down into the viewer would presumably
// fix that.  An alternative might be to put controls in a class.
class Viewer extends Component {
    constructor(props) {
	super(props);
	let state = {
	    rotationStates: props.rotationStates,
	    cycles: 0,
	};
	state.dimensions = props.figure.dimensions;
	state.figure = props.figure;
	state.viewSize = props.viewSize;
	state.viewAngle = props.viewAngle;
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
	let state = {...oldstate};
	// we could sample the props at this point.
	// Increment cycles - that's what controls the rotation
	++ state.cycles;
	return state;
    }
    
    render() {
	let state = this.state;
	let size = state.viewSize;
	let figure = state.figure;
	// At this point we could re-use a transformStack passed to us in the state.
	// Right now we're playing it safe and treating it as immutable.
	let transforms = new transformStack(state.dimensions);
	for (let r of state.rotationStates) {
	    r.applyTo(transforms, state.cycles);
	}
	let transformed = transforms.transformPoints(figure.vertices);
	let verts = transforms.getScreenPoints(transformed, state.viewAngle, size);
	return (
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
	);
    }
}

function SetViewAngle(props) {
    return (
	<input type="range" value={props.value} min={props.min} max={props.max}
	       onInput={props.callback}
	       />
    );
}

function SelectDimensions(props) {
    let list = [];
    for (let d = MIN_DIM; d <= MAX_DIM; ++d) {
	list.push(`${d}-D`);
    }
    return (<select onInput={props.callback} $HasKeyedChildren>
	    { list.map((item, n) => {
		return (n === (props.value - MIN_DIM))
		  ?  <option value={n + MIN_DIM} key={item} selected>{item}</option>
		  :  <option value={n + MIN_DIM} key={item}         >{item}</option>;
	      })
	    }
	    </select> );
}

// Making this a class doesn't help the flicker
function SelectFigure(props) {
    let list = props.list;
    let index = props.value;
    return (<select onInput={props.callback} $HasKeyedChildren>
	    { list.map((fig, n) => {
	      return (n === index)
		  ?  <option value={n} key={fig.name} selected>{fig.name}</option>
		  :  <option value={n} key={fig.name}         >{fig.name}</option>;
	      })
	    }
	    </select>);
}

export default App;
