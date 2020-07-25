
import React, { useState } from 'react';

import Header from './Header';
import Viewer from './Viewer';

import data from './../data.json';

import './index.scss';

const App = () => {
  const [ currentIndex, setIndex ] = useState(() => {
    let id = localStorage.getItem('my-id');
    if (window.location.search) {
      id = new URLSearchParams(window.location.search).get('id');
    }
    const idx = data.findIndex(p => p.id == id);
    return idx >= 0 ? idx : 0;
  });
  const setCurrentIndex = (idx) => {
    setIndex(idx);
    localStorage.setItem('my-id', data[idx]?.id);
  }
  const isPrevVisible = currentIndex > 0;
  const isNextVisible = currentIndex < data.length - 1;
  const previous = () => {
    if (isPrevVisible) {
      setCurrentIndex(currentIndex - 1);
    }
  }
  const next = () => {
    if (isNextVisible) {
      setCurrentIndex(currentIndex + 1);
    }
  }
  return (
    <>
      <Header/>
      <main>
        <button
          onClick={previous}
          style={
            !isPrevVisible ?
            { visibility: 'hidden' } :
            {}
          }
          className='my-btn-left'>
          <i className="fas fa-arrow-circle-left"></i>
        </button>
        <Viewer
          idx={currentIndex}
          total={data.length}
          {...data[currentIndex]}
          setCurrentIndex={setCurrentIndex}/>
        <button
          onClick={next}
          style={
            !isNextVisible ?
            { visibility: 'hidden' } :
            {}
          }
          className='my-btn-right'>
          <i className="fas fa-arrow-circle-right"></i>
        </button>
      </main>
    </>
  );
}

export default App;
