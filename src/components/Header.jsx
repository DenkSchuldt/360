
import { CodeXml, MessageCircle, Camera } from 'lucide-react';

import './Header.scss';


const Header = ({ style }) => {
  return (
    <header
      style={style}
      className='my-header'>
      <h1>Aventuras en 360º</h1>
      <div>
        <a
          target='_blank'
          rel='noopener noreferrer'
          aria-label='GitHub de Denny Schuldt'
          title='GitHub'
          href='https://github.com/DenkSchuldt'>
          <CodeXml size={24} />
        </a>
        <a
          target='_blank'
          rel='noopener noreferrer'
          aria-label='Twitter de Denny Schuldt'
          title='Twitter'
          href='https://twitter.com/DenkSchuldt'>
          <MessageCircle size={24} />
        </a>
        <a
          target='_blank'
          rel='noopener noreferrer'
          aria-label='Instagram de Denny Schuldt'
          title='Instagram'
          href='https://www.instagram.com/denkschuldt/'>
          <Camera size={24} />
        </a>
      </div>
    </header>
  )
}

export default Header;

