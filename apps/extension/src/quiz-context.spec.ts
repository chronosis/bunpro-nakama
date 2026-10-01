import { parseQuizMetadata } from './quiz-meta';
import { readQuizContext } from './quiz-context';

describe('readQuizContext', () => {
  it('reads the sentence prompt and a grammar link', () => {
    document.body.innerHTML = `
      <div id="quiz-metadata-element" data-meta-info="null"></div>
      <div class="bp-quiz-question">これはペン___。</div>
      <a href="/grammar_points/te-form">て-form</a>
    `;
    const metadata = parseQuizMetadata(
      document.getElementById('quiz-metadata-element') as HTMLElement,
    );

    expect(readQuizContext(document, metadata)).toEqual({
      prompt: 'これはペン___。',
      grammarPoint: 'て-form',
      helpPrompt: null,
    });
  });

  it('drops the form button and keeps the visible translation', () => {
    document.body.innerHTML = `
      <div id="quiz-metadata-element" data-meta-info='{"id":84,"type":"grammar_point"}'></div>
      <div class="bp-quiz-question">どちら<span class="bp-quiz-tense">Polite, Interrogative</span>。</div>
      <div class="bp-quiz-trans">Which will you decide on?</div>
      <div class="bp-quiz-trans bp-quiz-trans--hint">decide on</div>
    `;
    const metadata = parseQuizMetadata(
      document.getElementById('quiz-metadata-element') as HTMLElement,
    );

    expect(readQuizContext(document, metadata)).toEqual({
      prompt: 'どちら。 — Which will you decide on?',
      grammarPoint: 'grammar_point #84',
      helpPrompt: 'Polite, Interrogative',
    });
  });

  it('keeps highlighted grammar as emphasis instead of span tags', () => {
    document.body.innerHTML = `
      <div id="quiz-metadata-element" data-meta-info="null"></div>
      <div class="bp-quiz-question">コンビニ<span class="gp-popout" data-gp-id="25">で</span>お水。</div>
    `;
    const metadata = parseQuizMetadata(
      document.getElementById('quiz-metadata-element') as HTMLElement,
    );

    expect(readQuizContext(document, metadata).prompt).toBe('コンビニ**で**お水。');
  });

  it('keeps strong highlights as a stronger emphasis', () => {
    document.body.innerHTML = `
      <div id="quiz-metadata-element" data-meta-info="null"></div>
      <div class="bp-quiz-question">この<span class="gp-popout"><strong>より</strong></span>その。</div>
    `;
    const metadata = parseQuizMetadata(
      document.getElementById('quiz-metadata-element') as HTMLElement,
    );

    expect(readQuizContext(document, metadata).prompt).toBe('この***より***その。');
  });
});
