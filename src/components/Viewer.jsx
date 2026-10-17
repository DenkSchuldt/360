
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { useState, useEffect, useRef } from 'react';
import { createPanoramaViewer } from '../panorama';
import { motion, AnimatePresence } from "framer-motion";
import { CirclePlus, MapPinned, Pin, Maximize, Pause, Play, ZoomIn, ZoomOut } from 'lucide-react';
import { CircularProgressbar } from 'react-circular-progressbar';

import 'react-circular-progressbar/dist/styles.css';
import './Viewer.scss';

dayjs.locale("es");


const Viewer = props => {
  const {
    id, idx, total, src, name, marker, date, tags, location, setCurrentIndex,
    anchoredTags, setAnchoredTags, openTagsDialog
  } = props;
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [ index, setIndex ] = useState(idx + 1);
  const [ progress, setProgress ] = useState();
  const [ error, setError ] = useState();
  const [ notice, setNotice ] = useState();
  const [ rotating, setRotating ] = useState(true);
  const [ retry, setRetry ] = useState(0);
  const imageUrl = `${import.meta.env.BASE_URL}images/${src}`;

  useEffect(() => {
    let viewer;
    try {
      viewer = createPanoramaViewer(containerRef.current);
      viewerRef.current = viewer;
    } catch {
      setError('No se pudo iniciar el visor 360. Usa un navegador compatible con WebGL 2.');
      return;
    }
    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!viewerRef.current) return;
    setError(undefined);
    return viewerRef.current.load(imageUrl, setProgress, setError);
  }, [imageUrl, retry]);

  const toggleRotation = () => {
    const enabled = !rotating;
    viewerRef.current?.setAutoRotate(enabled);
    setRotating(enabled);
  };

  useEffect(() => {
    setIndex(idx + 1);
  }, [idx]);
  return (
    <div
      className='my-vwr-wrapper'>
      <div className='my-vwr-header'>
        <span className='index'>
          <input
            type='number'
            aria-label='Número de panorama'
            min={1}
            max={total}
            step={1}
            value={index}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const x = Number(index)
                if (Number.isInteger(x) && x >= 1 && x <= total) {
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
        ref={containerRef}
        className='my-vwr'>
        {
          marker &&
          <a
            href={marker}
            target='_blank'
            className='my-vwr-marker'
            rel='noopener noreferrer'
            aria-label='Ver ubicación en el mapa'>
            <MapPinned size={24} />
          </a>
        }
        <div className='panorama-controls' aria-label='Controles de panorámica'>
          <button type='button' aria-label='Alejar' title='Alejar' onClick={() => viewerRef.current?.zoomBy(5)}><ZoomOut size={22} /></button>
          <button type='button' aria-label='Acercar' title='Acercar' onClick={() => viewerRef.current?.zoomBy(-5)}><ZoomIn size={22} /></button>
          <button type='button' aria-label={rotating ? 'Pausar autorrotación' : 'Activar autorrotación'} title={rotating ? 'Pausar autorrotación' : 'Activar autorrotación'} aria-pressed={rotating} onClick={toggleRotation}>
            {rotating ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <button type='button' aria-label='Pantalla completa' title='Pantalla completa' onClick={() => {
            viewerRef.current?.toggleFullscreen().catch(() => setNotice('Este navegador no permite activar pantalla completa.'));
          }}><Maximize size={22} /></button>
        </div>
        {notice && <div className='panorama-notice' role='status'>
          <span>{notice}</span>
          <button type='button' onClick={() => setNotice(undefined)}>Cerrar aviso</button>
        </div>}
        {error && <div className='panorama-error' role='alert'>
          <p>{error}</p>
          {viewerRef.current && <button type='button' onClick={() => setRetry(value => value + 1)}>Reintentar</button>}
        </div>}
        <motion.div
          aria-hidden={progress === undefined}
          initial={{ opacity: 0 }}
          animate={{
            opacity: progress !== undefined ? 1 : 0
          }}
          className='my-vwr-progress-wrapper'>
          <CircularProgressbar
            value={progress || 0}
            className='my-vwr-progress'/>
        </motion.div>
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
                key={tag}
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
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="dnk-pin">
                      <Pin size={12} />
                    </motion.span>
                  }
                </AnimatePresence>
              </motion.span>
            ))
          }
          {
            tags.length > 0 &&
            <motion.span
              role='button'
              tabIndex={0}
              aria-label='Filtrar por hashtags'
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openTagsDialog();
                }
              }}
              className='dnk-tag'
              onClick={openTagsDialog}>
              <CirclePlus size={16} />
            </motion.span>
          }
        </motion.div>
      </div>
    </div>
  )
}

export default Viewer;

