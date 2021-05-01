
import dayjs from 'dayjs';
import es from 'dayjs/locale/es';
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from 'react';

import './Viewer.scss';

dayjs.locale("es");


const Viewer = props => {
  const {
    id, idx, total, src, name, marker, date, tags, location, setCurrentIndex,
    anchoredTags, setAnchoredTags, openTagsDialog, history
  } = props;
  const [ viewer, setViewer ] = useState();
  const [ index, setIndex ] = useState('');
  useEffect(() => {
    history.replace(`?id=${id}`);
    setIndex(idx + 1);
    let pano = new window.PANOLENS.ImagePanorama(`${window.location.origin}/360/images/${src}`);
    let v;
    if (viewer) {
      v = viewer;
    } else {
      v = new window.PANOLENS.Viewer({
        container: document.getElementById('myVwr'),
        cameraFov: 65,
        autoRotate: true,
        autoRotateSpeed: 1,
        autoRotateActivationDuration: 10000,
        controlButtons: ['fullscreen', 'setting']
      });
      v.getCamera().translateX(500);
      v.getCamera().translateY(-100);
      setViewer(v);
    }
    v.clearAllCache();
    v.add(pano);
    v.setPanorama(pano);
  }, [id, idx]);
  return (
    <div
      className='my-vwr-wrapper'>
      <div className='my-vwr-header'>
        <span className='index'>
          <input
            type='number'
            value={index}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const x = parseInt(index)
                if (x >= 1 && x <= total) {
                  setCurrentIndex(x - 1);
                }
              }
            }}
            size={`${index}`.length}
            onChange={e => setIndex(e.target.value)}/>
          { `/${total}` }
        </span>
        <div className='content'>
          <strong>
            { name }
          </strong>
          <div>
           { location }
          </div>
        </div>
      </div>
      <div
        id='myVwr'
        className='my-vwr'>
        {
          marker &&
          <a
            href={marker}
            target='_blank'
            className='my-vwr-marker'
            rel='noopener noreferrer'
            onClick={() => window.open(marker, '_blank')}>
            <i className="fas fa-map-marked-alt"></i>
          </a>
        }
      </div>
      <div className='my-vwr-footer'>
        {
          date &&
          <>
            <span className='dnk-date'>
              { dayjs(date).format('MMMM, YYYY') }
            </span>
            <span className='dnk-dot'>&#183;</span>
          </>
        }
        <motion.div className='dnk-tags'>
          {
            tags.map((tag, idx) => (
              <motion.span
                key={idx}
                className='dnk-tag'
                onClick={() => {
                  setAnchoredTags(
                    anchoredTags.includes(tag) ?
                      anchoredTags.filter(t => t !== tag) :
                      [ ...anchoredTags, tag]
                  )
                }}>
                {`#${tag}`}
                <AnimatePresence>
                  {
                    anchoredTags.includes(tag) &&
                    <motion.i
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="fas fa-thumbtack">
                    </motion.i>
                  }
                </AnimatePresence>
              </motion.span>
            ))
          }
          {
            tags.length > 0 &&
            <motion.span
              key={idx}
              className='dnk-tag'
              onClick={openTagsDialog}>
              <i className="fas fa-plus-circle"></i>
            </motion.span>
          }
        </motion.div>
      </div>
    </div>
  )
}

export default Viewer;
