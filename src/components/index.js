
import { motion } from "framer-motion";
import { useHistory } from "react-router-dom";
import React, { useState, useEffect } from 'react';

import Header from './Header';
import Viewer from './Viewer';
import TagsDialog from './TagsDialog';

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
  const [ isTagsDialogVisible, setIsTagsDialogVisible ] = useState(false);
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
  useEffect(() => {
    const id = data[currentIndex].id;
    if (anchoredTags.length) {
      const array = rawData.filter(d => (
        d.tags.some(t => anchoredTags.includes(t))
      ));
      const idx = array.findIndex(e => e.id == id);
      setCurrentIndex(idx >= 0 ? idx : 0);
      setData(array);
    } else {
      const idx = rawData.findIndex(e => e.id == id);
      setCurrentIndex(idx >= 0 ? idx : 0);
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
            scale: (!isPrevVisible || isTagsDialogVisible) ? 0 : 1
          }}
          className='my-btn-left'>
          <i className="fas fa-arrow-left"></i>
          <span>Previa</span>
        </motion.button>
        <Viewer
          history={history}
          idx={currentIndex}
          total={data.length}
          {...data[currentIndex]}
          anchoredTags={anchoredTags}
          setAnchoredTags={setAnchoredTags}
          setCurrentIndex={setCurrentIndex}
          openTagsDialog={() => setIsTagsDialogVisible(true)}/>
        <motion.button
          onClick={next}
          initial={{ scale: 0 }}
          animate={{
            scale: (!isNextVisible || isTagsDialogVisible) ? 0 : 1
          }}
          className='my-btn-right'>
          <span>Siguiente</span>
          <i className="fas fa-arrow-right"></i>
        </motion.button>
      </main>
      {
        isTagsDialogVisible &&
        <TagsDialog
          tags={rawData.reduce(
            (computed, item) => {
              return [...new Set([...computed, ...item.tags])]
            },
            []
          )}
          anchoredTags={anchoredTags}
          setAnchoredTags={setAnchoredTags}
          onClose={() => setIsTagsDialogVisible(false)}/>
      }
    </>
  );
}

export default App;
