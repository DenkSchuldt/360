
import { motion } from "framer-motion";
import { useHistory } from "react-router-dom";
import React, { useState, useEffect } from 'react';

import Header from './Header';
import Viewer from './Viewer';

import rawData from './../data.json';

import './index.scss';

const App = () => {
  const history = useHistory();
  const [ data, setData ] = useState(rawData);
  const [ anchoredTags, setTags ] = useState(() => {
    let tags = [];
    try {
      tags = JSON.parse(localStorage.getItem('my-tags') || '[]');
    } catch (e) {
      console.log(e);
    }
    return tags;
  });
  const setAnchoredTags = tags => {
    setTags(tags);
    localStorage.setItem('my-tags', JSON.stringify(tags));
  }
  const [ currentIndex, setIndex ] = useState(() => {
    const id = new URLSearchParams(history.location.search).get('id');
    let storedId = id || localStorage.getItem('my-id');
    const idx = data.findIndex(p => p.id == storedId);
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
      const item = data[currentIndex - 1];
      history.replace(`?id=${item.id}`);
      setCurrentIndex(currentIndex - 1);
    }
  }
  const next = () => {
    if (isNextVisible) {
      const item = data[currentIndex + 1];
      history.replace(`?id=${item.id}`);
      setCurrentIndex(currentIndex + 1);
    }
  }
  useEffect(() => {
    const id = data[currentIndex].id;
    if (anchoredTags.length) {
      const array = rawData.filter(d => (
        d.tags.some(t => anchoredTags.includes(t))
      ));
      setCurrentIndex(array.findIndex(e => e.id == id));
      setData(array);
    } else {
      setCurrentIndex(rawData.findIndex(e => e.id == id));
      setData(rawData);
    }
  }, [anchoredTags.reduce((a, c) => a + c, '')])
  return (
    <>
      <Header/>
      <main>
        <motion.button
          onClick={previous}
          initial={{ scale: 0 }}
          animate={{
            scale: !isPrevVisible ? 0 : 1
          }}
          className='my-btn-left'>
          <i className="fas fa-arrow-circle-left"></i>
        </motion.button>
        <Viewer
          idx={currentIndex}
          total={data.length}
          {...data[currentIndex]}
          anchoredTags={anchoredTags}
          setAnchoredTags={setAnchoredTags}
          setCurrentIndex={setCurrentIndex}/>
        <motion.button
          onClick={next}
          initial={{ scale: 0 }}
          animate={{
            scale: !isNextVisible ? 0 : 1
          }}
          className='my-btn-right'>
          <i className="fas fa-arrow-circle-right"></i>
        </motion.button>
      </main>
    </>
  );
}

export default App;
