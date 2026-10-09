import {
  appendFormatted,
  findBadTranslation,
  isSrsLabel,
  JULY_FOLLOWING,
  removeBadTranslation,
  resolveStored,
  upsertBadTranslation,
} from './bad-translations';

describe('bad translations', () => {
  it('starts with the July example and keeps an emptied list empty', () => {
    expect(resolveStored(undefined)).toEqual([JULY_FOLLOWING]);
    expect(resolveStored([])).toEqual([]);
  });

  it('matches the sentence and the official translation together', () => {
    const items = resolveStored(undefined);
    expect(findBadTranslation(items, '７月の___は８月だ。', 'After July comes August.')?.id).toBe(
      JULY_FOLLOWING.id,
    );
    expect(findBadTranslation(items, '７月の____は８月だ。', 'After  July comes August.')?.alternative).toBe(
      JULY_FOLLOWING.alternative,
    );
    expect(findBadTranslation(items, '６月の___は７月だ。', 'After July comes August.')).toBeNull();
  });

  it('updates an existing flag instead of adding a second copy', () => {
    const next = upsertBadTranslation([JULY_FOLLOWING], {
      question: '７月の___は８月だ。',
      translation: 'After July comes August.',
      alternative: 'July is followed by **August**',
      now: '2026-10-06T00:00:00.000Z',
    });

    expect(next).toHaveLength(1);
    expect(next[0]?.alternative).toBe('July is followed by **August**');
    expect(removeBadTranslation(next, JULY_FOLLOWING.id)).toEqual([]);
  });

  it('turns double asterisks into strong text and leaves markup as text', () => {
    const parent = document.createElement('p');
    appendFormatted(parent, "July's **following** (month) is August <script>", document);

    expect(parent.querySelector('strong')?.textContent).toBe('following');
    expect(parent.querySelector('script')).toBeNull();
    expect(parent.textContent).toBe("July's following (month) is August <script>");
  });

  it('recognizes an SRS stage label', () => {
    expect(isSrsLabel('Guru 2')).toBe(true);
    expect(isSrsLabel('Adept 2')).toBe(true);
    expect(isSrsLabel('Your SRS progress')).toBe(true);
    expect(isSrsLabel('Current SRS stage: Apprentice')).toBe(true);
    expect(isSrsLabel('Reviews')).toBe(false);
  });
});
