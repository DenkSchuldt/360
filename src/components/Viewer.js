
import React, { useState, useEffect } from 'react';

import './Viewer.scss';


const Viewer = props => {
  const {
    id, idx, total, src, name, location, setCurrentIndex
  } = props;
  const [ viewer, setViewer ] = useState();
  const [ index, setIndex ] = useState('');
  useEffect(() => {
    setIndex(idx + 1);
    console.log(`${window.location.origin}/images/${src}`);
    let pano = new window.PANOLENS.ImagePanorama(`${window.location.origin}/images/${src}`);
    let v;
    if (viewer) {
      v = viewer;
    } else {
      v = new window.PANOLENS.Viewer({
        container: document.getElementById('myVwr'),
        cameraFov: 65,
        autoRotate: true,
        autoRotateSpeed: 1,
        autoRotateActivationDuration: 10000
      });
      v.getCamera().translateX(500);
      v.getCamera().translateY(-100);
      setViewer(v);
    }
    v.clearAllCache();
    v.add(pano);
    v.setPanorama(pano);
  }, [idx]);
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
      </div>
      <div className='my-vwr-footer'>
        <div
          className="fb-share-button"
          data-href="https://360.dennyschuldt.com"
          data-layout="button"
          data-size="small">
          <a
            target="_blank"
            href={`https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2F360.dennyschuldt.com%3Fid%3D${id}%2F&amp;src=sdkpreparse`}
            class="fb-xfbml-parse-ignore">
            Share
          </a>
        </div>
        <a
          target="_blank"
          rel="noopener noreferrer"
          className="twitter-share-button"
          href={`https://twitter.com/intent/tweet?text=${escape(`Aventuras en 360: Mira ` + name)}`}>
          Tweet
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          className="github-button"
          href="https://github.com/denkschuldt/360"
          data-color-scheme="no-preference: dark; light: dark; dark: dark;"
          aria-label="Star denkschuldt/360 on GitHub">
          Star
        </a>
      </div>
    </div>
  )
}

export default Viewer;
