
import React from 'react';
import ReactDOM from 'react-dom';

import App from './components';

import './index.css';


document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('AventurasEn360')
  );
});
