import { StrictMode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from './index.jsx';
import rawData from '../data.json';

function RouterProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid='location'>
        {location.pathname}
        {location.search}
      </output>
      <button onClick={() => navigate(-1)}>Browser back</button>
      <button onClick={() => navigate(1)}>Browser forward</button>
    </>
  );
}

function renderGallery(initialEntries = ['/360/']) {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
        <RouterProbe />
      </MemoryRouter>
    </StrictMode>,
  );
}

function currentSearch() {
  return new URL(
    screen.getByTestId('location').textContent,
    'https://example.test',
  ).searchParams;
}

async function expectPanorama(panorama, index, total = rawData.length) {
  await waitFor(() => {
    expect(
      screen.getByRole('spinbutton', { name: 'Número de panorama' }),
    ).toHaveValue(index + 1);
    expect(currentSearch().get('id')).toBe(String(panorama.id));
    expect(localStorage.getItem('my-id')).toBe(String(panorama.id));
  });
  expect(
    screen.getByText(panorama.name, { selector: '.my-vwr-header strong' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('spinbutton').parentElement).toHaveTextContent(
    `/${total}`,
  );
}

async function openFilters(user) {
  await user.click(screen.getByLabelText('Filtrar por hashtags'));
  expect(screen.getByText('Hashtags')).toBeInTheDocument();
  const dialog = document.querySelector('.dnk-dialog');
  expect(dialog).toBeInTheDocument();
  return within(dialog);
}

async function applyFilters(user, dialog) {
  await user.click(dialog.getByRole('button', { name: 'Aplicar' }));
  await waitFor(() =>
    expect(screen.queryByText('Hashtags')).not.toBeInTheDocument(),
  );
}

describe('gallery routing and persisted state', () => {
  it('honors a deep link over the saved panorama and preserves other query parameters', async () => {
    localStorage.setItem('my-id', String(rawData[1].id));
    renderGallery([`/360/?id=${rawData[5].id}&ref=shared`]);

    await expectPanorama(rawData[5], 5);
    expect(currentSearch().get('ref')).toBe('shared');
  });

  it('restores the saved panorama when the URL has no id', async () => {
    localStorage.setItem('my-id', String(rawData[3].id));
    renderGallery();

    await expectPanorama(rawData[3], 3);
  });

  it('falls back safely for an unknown explicit URL id', async () => {
    localStorage.setItem('my-id', String(rawData[3].id));
    renderGallery(['/360/?id=does-not-exist']);

    await expectPanorama(rawData[0], 0);
    expect(screen.getByRole('button', { name: 'Previa' })).toBeDisabled();
  });

  it('keeps navigation, number entry, storage and the URL in sync', async () => {
    const user = userEvent.setup();
    renderGallery();
    await expectPanorama(rawData[0], 0);

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await expectPanorama(rawData[1], 1);
    await user.click(screen.getByRole('button', { name: 'Previa' }));
    await expectPanorama(rawData[0], 0);

    const input = screen.getByRole('spinbutton', {
      name: 'Número de panorama',
    });
    for (const value of ['0', String(rawData.length + 1), '1.5']) {
      await user.clear(input);
      await user.type(input, `${value}{Enter}`);
      expect(currentSearch().get('id')).toBe(String(rawData[0].id));
      expect(localStorage.getItem('my-id')).toBe(String(rawData[0].id));
    }
    await user.clear(input);
    await user.type(input, `${rawData.length}{Enter}`);
    await expectPanorama(rawData.at(-1), rawData.length - 1);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
  });

  it('responds to back and forward route changes without rewriting their panorama ids', async () => {
    const user = userEvent.setup();
    renderGallery([`/360/?id=${rawData[2].id}`, `/360/?id=${rawData[5].id}`]);
    await expectPanorama(rawData[5], 5);

    await user.click(screen.getByRole('button', { name: 'Browser back' }));
    await expectPanorama(rawData[2], 2);
    await user.click(screen.getByRole('button', { name: 'Browser forward' }));
    await expectPanorama(rawData[5], 5);
  });

  it.each([
    '{invalid-json',
    'null',
    '"Argentina"',
    '{}',
    '["Unknown tag", 12, null]',
  ])('recovers from unusable stored filters: %s', async value => {
    localStorage.setItem('my-tags', value);
    renderGallery();

    await expectPanorama(rawData[0], 0);
    expect(localStorage.getItem('my-tags')).toBe('[]');
  });

  it('restores valid filters while removing unknown tags and preserves a matching deep link', async () => {
    const argentina = rawData.filter(item => item.tags.includes('Argentina'));
    const selected = argentina[2];
    localStorage.setItem(
      'my-tags',
      JSON.stringify(['Argentina', 'Unknown tag', null]),
    );
    renderGallery([`/360/?id=${selected.id}`]);

    await expectPanorama(selected, 2, argentina.length);
    expect(JSON.parse(localStorage.getItem('my-tags'))).toEqual(['Argentina']);
  });

  it('remains navigable when browser storage is unavailable', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage unavailable', 'SecurityError');
    });
    const user = userEvent.setup();
    renderGallery();

    expect(screen.getByRole('spinbutton')).toHaveValue(1);
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(screen.getByRole('spinbutton')).toHaveValue(2);
    expect(currentSearch().get('id')).toBe(String(rawData[1].id));
  });
});

describe('installed dialog integration', () => {
  it('applies filters, preserves the selected id, and navigates in the filtered list', async () => {
    const user = userEvent.setup();
    const argentina = rawData.filter(item => item.tags.includes('Argentina'));
    const selected = argentina[2];
    const originalIndex = rawData.indexOf(selected);
    renderGallery([`/360/?id=${selected.id}&ref=shared`]);
    await expectPanorama(selected, originalIndex);

    let dialog = await openFilters(user);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    await user.click(dialog.getByText('#Argentina'));
    expect(localStorage.getItem('my-tags')).toBe('[]');
    await applyFilters(user, dialog);
    await expectPanorama(selected, 2, argentina.length);
    expect(JSON.parse(localStorage.getItem('my-tags'))).toEqual(['Argentina']);
    expect(currentSearch().get('ref')).toBe('shared');

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    await expectPanorama(argentina[3], 3, argentina.length);
    await user.click(screen.getByRole('button', { name: 'Previa' }));
    await expectPanorama(selected, 2, argentina.length);

    dialog = await openFilters(user);
    await user.click(dialog.getByText('#Argentina'));
    await applyFilters(user, dialog);
    await expectPanorama(selected, originalIndex);
    expect(localStorage.getItem('my-tags')).toBe('[]');
  });

  it('chooses the first matching panorama when the current one is filtered out', async () => {
    const user = userEvent.setup();
    const argentina = rawData.filter(item => item.tags.includes('Argentina'));
    renderGallery();
    await expectPanorama(rawData[0], 0);

    const dialog = await openFilters(user);
    await user.click(dialog.getByText('#Argentina'));
    await applyFilters(user, dialog);

    await expectPanorama(argentina[0], 0, argentina.length);
    expect(localStorage.getItem('my-id')).not.toBe('undefined');
  });

  it.each(['cancel', 'close', 'Escape'])(
    'discards draft filter changes on %s and can reopen cleanly',
    async dismissal => {
      const user = userEvent.setup();
      renderGallery();
      await expectPanorama(rawData[0], 0);
      let dialog = await openFilters(user);
      await user.click(dialog.getByText('#Argentina'));

      if (dismissal === 'cancel') {
        await user.click(dialog.getByRole('button', { name: /cancel/i }));
      } else if (dismissal === 'close') {
        await user.click(dialog.getByRole('button', { name: 'Close dialog' }));
      } else {
        await user.keyboard('{Escape}');
      }
      await waitFor(() =>
        expect(screen.queryByText('Hashtags')).not.toBeInTheDocument(),
      );
      await expectPanorama(rawData[0], 0);
      expect(localStorage.getItem('my-tags')).toBe('[]');

      dialog = await openFilters(user);
      await applyFilters(user, dialog);
      await expectPanorama(rawData[0], 0);
      expect(localStorage.getItem('my-tags')).toBe('[]');
    },
  );
});
