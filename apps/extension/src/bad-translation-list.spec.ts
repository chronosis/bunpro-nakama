import { JULY_FOLLOWING } from './bad-translations';
import { fillBadTranslationList } from './bad-translation-list';

describe('fillBadTranslationList', () => {
  it('renders flagged sentences as table rows with a trash button', () => {
    const body = document.createElement('tbody');
    const removed: string[] = [];
    fillBadTranslationList(body, [JULY_FOLLOWING], (id) => removed.push(id));

    const row = body.querySelector('tr');
    const button = row?.querySelector('button');
    expect(body.querySelectorAll('tr')).toHaveLength(1);
    expect(row?.querySelector('strong')?.textContent).toBe('following');
    expect(button?.textContent).toBe('');
    expect(button?.querySelector('svg')).not.toBeNull();
    expect(button?.getAttribute('aria-label')).toBe(`Remove ${JULY_FOLLOWING.question}`);
    button?.click();
    expect(removed).toEqual([JULY_FOLLOWING.id]);
  });

  it('shows an empty list message', () => {
    const body = document.createElement('tbody');
    fillBadTranslationList(body, [], () => undefined);
    expect(body.textContent).toBe('No flagged translations.');
    expect(body.querySelector('button')).toBeNull();
  });
});
