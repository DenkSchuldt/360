import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import Header from './Header';
import githubLogo from '../assets/brands/github.svg';
import xLogo from '../assets/brands/x.svg';
import instagramLogo from '../assets/brands/instagram.svg';

const profiles = [
  ['GitHub', 'https://github.com/DenkSchuldt', githubLogo],
  ['X', 'https://twitter.com/DenkSchuldt', xLogo],
  ['Instagram', 'https://www.instagram.com/denkschuldt/', instagramLogo],
];

describe('social profile links', () => {
  it('uses the corresponding local brand logos and accessible profile names', () => {
    render(<Header />);
    const navigation = screen.getByRole('navigation', {
      name: 'Redes sociales',
    });
    expect(within(navigation).getAllByRole('link')).toHaveLength(3);

    for (const [brand, destination, logo] of profiles) {
      const link = within(navigation).getByRole('link', {
        name: `${brand} de Denny Schuldt`,
      });
      expect(link).toHaveAttribute('href', destination);
      expect(link).toHaveAttribute('title', brand);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      const image = link.querySelector('img');
      expect(image).toHaveAttribute('src', logo);
      expect(image).toHaveAttribute('width', '24');
      expect(image).toHaveAttribute('height', '24');
      expect(image).toHaveAttribute('alt', '');
      expect(image).toHaveAttribute('aria-hidden', 'true');
    }
    expect(navigation.querySelector('.lucide')).not.toBeInTheDocument();
    expect(within(navigation).queryByRole('img')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Twitter/ }),
    ).not.toBeInTheDocument();
  });

  it('keeps all three profiles reachable in keyboard order', async () => {
    const user = userEvent.setup();
    render(<Header />);
    for (const [brand] of profiles) {
      await user.tab();
      expect(
        screen.getByRole('link', { name: `${brand} de Denny Schuldt` }),
      ).toHaveFocus();
    }
  });
});
