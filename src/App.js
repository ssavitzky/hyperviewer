import { version, Component } from 'inferno';
import './registerServiceWorker';
import {cube, kite, simplex} from './polytopes';
import {transformStack} from './transform-stack';
import './transforms';
import './App.css';

var dimensions = 4;
var figures  = [new kite(4), new cube(4), new simplex(4)];

class App extends Component {
    constructor(props) {
	super(props);
	let dim = dimensions;	// This all belongs in the state.
	this.state = {
	    dimensions: dim,
	    figure: figures[1],
	    transforms: new transformStack(dim),
	    viewerSize: 500
	}
	this.dimension = dim;
	this.figure = figures[1];
	this.transforms = new transformStack(dim);
	this.viewerSize = 500;
    }
    
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h3>{`Welcome to Hyperspace Express viewer, Inferno version ${version}`}</h3>
        </header>
	<Viewer size={this.viewerSize} figure={this.figure} transform={this.transforms} />
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

class AppState {
    constructor(dim) {

    }
}

function Viewer(props) {
    let size = props.size;
    let fig = props.figure;
    let xform = props.transforms;

    return (
	<svg width={size} height={size} >
	  <Line from={[0, 0]} to={[size/2, size/2]}/>

	</svg>

    );

}

function Line(props) {
    return (
	<line x1={props.from[0]} y1={props.from[1]}
	      x2={props.to[0]} y2={props.to[1]} 
	      stroke='green' strokeWidth='2'
	      />
    );
}

export default App;
