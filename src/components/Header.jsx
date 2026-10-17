import githubLogo from '../assets/brands/github.svg';
import xLogo from '../assets/brands/x.svg';
import instagramLogo from '../assets/brands/instagram.svg';

import './Header.scss';

const Header = ({ style }) => {
  return (
    <header style={style} className='my-header'>
      <h1>Aventuras en 360º</h1>
      <nav className='social-links' aria-label='Redes sociales'>
        <a
          target='_blank'
          rel='noopener noreferrer'
          aria-label='GitHub de Denny Schuldt'
          title='GitHub'
          href='https://github.com/DenkSchuldt'
        >
          <img
            className='brand-icon'
            src={githubLogo}
            width={24}
            height={24}
            alt=''
            aria-hidden='true'
          />
        </a>
        <a
          target='_blank'
          rel='noopener noreferrer'
          aria-label='X de Denny Schuldt'
          title='X'
          href='https://twitter.com/DenkSchuldt'
        >
          <img
            className='brand-icon'
            src={xLogo}
            width={24}
            height={24}
            alt=''
            aria-hidden='true'
          />
        </a>
        <a
          target='_blank'
          rel='noopener noreferrer'
          aria-label='Instagram de Denny Schuldt'
          title='Instagram'
          href='https://www.instagram.com/denkschuldt/'
        >
          <img
            className='brand-icon'
            src={instagramLogo}
            width={24}
            height={24}
            alt=''
            aria-hidden='true'
          />
        </a>
      </nav>
    </header>
  );
};

export default Header;
