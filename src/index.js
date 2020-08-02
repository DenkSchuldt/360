
import React from 'react';
import ReactDOM from 'react-dom';
import {
  Route,
  Switch,
  Redirect,
  BrowserRouter as Router
} from "react-router-dom";

import App from './components';

import './index.css';


document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <React.StrictMode>
      <Router>
        <Switch>
          <Route path="/(|id)/:id?">
            <App />
          </Route>
          <Route>
            <Redirect to="/"/>
          </Route>
        </Switch>
      </Router>
    </React.StrictMode>,
    document.getElementById('AventurasEn360')
  );
});
