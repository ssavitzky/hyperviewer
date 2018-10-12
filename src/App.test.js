import { render } from 'inferno';
import App from './App';
import {simplex} from './polytopes';

it('renders without crashing', () => {
  const div = document.createElement('div');
  render(<App />, div);
});

it('continues to make polytopes correctly', () => {
    const div = document.createElement('div');
    let app = <App/>;
    render(app, div);
    let s = new simplex(3);
});

