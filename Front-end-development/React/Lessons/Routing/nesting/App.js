import './App.css';

import Home from './components/Home/Home'
import Users from './components/Users/Users'
import About from './components/About/About'
import User from './components/User/User'

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from 'react-router-dom'

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/users">Users</Link>
            </li>
          </ul>
        </nav>

        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/users" component={Users} />
          <Route path="/user/:id" component={User} />
        </Switch>
      </div>
    </Router>
  );
}




export default App;
