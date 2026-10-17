import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';

import Header from './Header';
import Viewer from './Viewer';
import TagsDialog from './TagsDialog';
import rawData from '../data.json';
import './index.scss';

const allTags = [...new Set(rawData.flatMap(item => item.tags))];

const readStored = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const writeStored = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The gallery remains usable when browser storage is unavailable.
  }
};

const App = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [storedId] = useState(() => readStored('my-id', ''));
  const [anchoredTags, setTags] = useState(() => {
    try {
      const saved = JSON.parse(readStored('my-tags', '[]'));
      return Array.isArray(saved) ? saved.filter(tag => allTags.includes(tag)) : [];
    } catch {
      return [];
    }
  });
  const data = useMemo(() => anchoredTags.length
    ? rawData.filter(item => item.tags.some(tag => anchoredTags.includes(tag)))
    : rawData, [anchoredTags]);
  const requestedId = searchParams.get('id') || storedId;
  const currentIndex = Math.max(0, data.findIndex(item => String(item.id) === requestedId));
  const current = data[currentIndex];
  const [isTagsDialogVisible, setIsTagsDialogVisible] = useState(false);
  const isPrevVisible = currentIndex > 0;
  const isNextVisible = currentIndex < data.length - 1;

  const setCurrentIndex = idx => {
    if (!data[idx]) return;
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      next.set('id', data[idx].id);
      return next;
    }, { replace: true });
  };

  useEffect(() => {
    writeStored('my-tags', JSON.stringify(anchoredTags));
  }, [anchoredTags]);

  useEffect(() => {
    writeStored('my-id', String(current.id));
    if (searchParams.get('id') !== String(current.id)) {
      setSearchParams(previous => {
        const next = new URLSearchParams(previous);
        next.set('id', current.id);
        return next;
      }, { replace: true });
    }
  }, [current.id, searchParams, setSearchParams]);

  return (
    <>
      <Header />
      <main>
        <motion.button
          onClick={() => setCurrentIndex(currentIndex - 1)}
          disabled={!isPrevVisible || isTagsDialogVisible}
          initial={{ scale: 0 }}
          animate={{ scale: (!isPrevVisible || isTagsDialogVisible) ? 0 : 1 }}
          className='my-btn-left'>
          <i className='fas fa-arrow-left'></i>
          <span>Previa</span>
        </motion.button>
        <Viewer
          idx={currentIndex}
          total={data.length}
          {...current}
          anchoredTags={anchoredTags}
          setAnchoredTags={setTags}
          setCurrentIndex={setCurrentIndex}
          openTagsDialog={() => setIsTagsDialogVisible(true)} />
        <motion.button
          onClick={() => setCurrentIndex(currentIndex + 1)}
          disabled={!isNextVisible || isTagsDialogVisible}
          initial={{ scale: 0 }}
          animate={{ scale: (!isNextVisible || isTagsDialogVisible) ? 0 : 1 }}
          className='my-btn-right'>
          <span>Siguiente</span>
          <i className='fas fa-arrow-right'></i>
        </motion.button>
      </main>
      {isTagsDialogVisible && (
        <TagsDialog
          tags={allTags}
          anchoredTags={anchoredTags}
          setAnchoredTags={setTags}
          onClose={() => setIsTagsDialogVisible(false)} />
      )}
    </>
  );
};

export default App;
