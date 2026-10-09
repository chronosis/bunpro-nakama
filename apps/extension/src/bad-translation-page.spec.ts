import { JULY_FOLLOWING } from './bad-translations';
import {
  ensureFlagButton,
  openTranslationModal,
  paintTranslations,
  readQuizSurface,
} from './bad-translation-page';

const QUIZ = `
  <header id="js-rev-header">
    <div>Grammar</div>
    <div class="header-end">
      <span>12</span>
      <span class="srs-badge"><span>Guru 2</span></span>
    </div>
  </header>
  <div class="bp-quiz-question">７月の___は８月だ。</div>
  <div class="bp-quiz-trans-wrap">
    <div class="bp-quiz-trans">After July comes August.</div>
    <div class="QuestionSentenceTransNuance">The <strong>next</strong> month.</div>
  </div>
`;

describe('bad translation page', () => {
  beforeEach(() => {
    document.body.innerHTML = QUIZ;
  });

  it('reads the cloze, the official translation, and the nuance', () => {
    expect(readQuizSurface(document)).toMatchObject({
      question: '７月の___は８月だ。',
      translation: 'After July comes August.',
      nuance: 'The next month.',
    });
  });

  it('shows a warning and the alternative under a flagged translation', () => {
    paintTranslations(document, [JULY_FOLLOWING]);
    paintTranslations(document, [JULY_FOLLOWING]);

    const translation = document.querySelector('.bp-quiz-trans');
    expect(translation?.querySelectorAll('.nakama-warn')).toHaveLength(1);
    expect(translation?.textContent?.startsWith('⚠️')).toBe(true);
    const alternative = translation?.nextElementSibling;
    expect(alternative?.classList.contains('nakama-alt')).toBe(true);
    expect(alternative?.classList.contains('prose-strong:text-primary-accent')).toBe(true);
    expect(alternative?.querySelector('strong')?.textContent).toBe('following');
    expect(alternative?.textContent).toBe("July's following (month) is August");
  });

  it('removes the note when the sentence is no longer flagged', () => {
    paintTranslations(document, [JULY_FOLLOWING]);
    paintTranslations(document, []);
    expect(document.querySelector('.nakama-warn, .nakama-alt')).toBeNull();
  });

  it('places the flag button before the last header control when the stage has no label', () => {
    document.body.innerHTML = `
      <div id="js-rev-header">
        <div>Grammar</div>
        <div><span id="streak">12</span><span id="stage"></span></div>
      </div>
    `;
    ensureFlagButton(document, () => undefined);
    expect(document.querySelector('[data-nakama-flag]')?.nextElementSibling?.id).toBe('stage');
  });

  it('places the flag button to the left of the Adept SRS control', () => {
    document.body.innerHTML = `
      <header class="sticky"></header>
      <header>
        <div class="justify-between">
          <ul><li><button title="Finish or wrap up the current session"></button></li></ul>
          <div>
            <ul>
              <li title="Your SRS progress"><p>Adept 2</p></li>
              <li title="Correct question attempts over total attempts"><p>0/0</p></li>
            </ul>
          </div>
        </div>
      </header>
    `;
    let clicks = 0;
    ensureFlagButton(document, () => {
      clicks += 1;
    });
    const level = document.querySelector('[title="Your SRS progress"]');
    const button = document.querySelector<HTMLButtonElement>('[data-nakama-flag]');
    expect(button?.closest('li')?.nextElementSibling).toBe(level);
    expect(button?.getAttribute('title')).toBe('Flag this translation');
    button?.click();
    expect(clicks).toBe(1);
  });

  it('places the flag button immediately to the left of the SRS level', () => {
    ensureFlagButton(document, () => undefined);
    const button = document.querySelector('[data-nakama-flag]');
    const badge = document.querySelector('.srs-badge');
    expect(button?.nextElementSibling).toBe(badge);
    expect(button?.getAttribute('aria-label')).toBe('Flag this translation');
    expect(button?.getAttribute('title')).toBe('Flag this translation');
  });

  it('saves the alternative typed into the modal', () => {
    const surface = readQuizSurface(document);
    const saved: string[] = [];
    openTranslationModal(document, surface, null, (alternative) => {
      saved.push(alternative);
    });
    const field = document.querySelector('textarea');
    const save = document.querySelector<HTMLButtonElement>('.nakama-modal-save');
    if (!field || !save) throw new Error('modal did not open');
    expect(document.querySelector('.nakama-modal strong')?.textContent).toBe('next');
    field.value = '   ';
    save.click();
    expect(saved).toEqual([]);
    field.value = 'July is followed by **August**';
    save.click();

    expect(saved).toEqual(['July is followed by **August**']);
    expect(document.querySelector('.nakama-modal-backdrop')).toBeNull();
  });
});
