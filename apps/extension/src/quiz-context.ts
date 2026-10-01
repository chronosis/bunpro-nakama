import { emphasizeInline } from '@bunpro-nakama/session-history';
import { grammarPointFromInfo, type QuizMetadata } from './quiz-meta';

export interface QuizContext {
  prompt: string | null;
  grammarPoint: string | null;
  helpPrompt: string | null;
}

export function readQuizContext(doc: ParentNode, metadata: QuizMetadata): QuizContext {
  const fromInfo = grammarPointFromInfo(metadata.raw['data-meta-info']);
  const link = doc.querySelector(
    'a[href*="/grammar_points/"], a[href*="/vocabs/"]',
  );
  const fromLink = collapse(link?.textContent ?? '');
  const idOnly = fromInfo !== null && / #\S+$/.test(fromInfo);

  return {
    prompt: readPrompt(doc),
    grammarPoint: (idOnly ? fromLink || fromInfo : fromInfo || fromLink) || null,
    helpPrompt: collapse(doc.querySelector('.bp-quiz-tense')?.textContent ?? '') || null,
  };
}

function readPrompt(doc: ParentNode): string | null {
  const promptNode = doc.querySelector('.bp-quiz-question');
  if (!promptNode) return null;
  const sentenceNode = promptNode.cloneNode(true) as Element;
  sentenceNode.querySelectorAll('.bp-quiz-tense').forEach((node) => node.remove());
  markEmphasis(sentenceNode);
  const sentence = collapse(sentenceNode.textContent ?? '');
  const translation = collapse(
    doc.querySelector('.bp-quiz-trans:not(.bp-quiz-trans--hint)')?.textContent ?? '',
  );
  if (sentence && translation) return `${sentence} — ${translation}`;
  return sentence || null;
}

export function collectDiagnostics(doc: Document, url: string, capturedAt: string) {
  const meta = doc.getElementById('quiz-metadata-element');
  const classes = [...doc.querySelectorAll('[class]')]
    .map((element) => element.className)
    .filter(
      (value): value is string =>
        typeof value === 'string' &&
        /quiz|review|answer|correct|incorrect|reveal|grammar|InputManual/i.test(value),
    )
    .slice(0, 40);

  return {
    url,
    capturedAt,
    metadataHtml: meta?.outerHTML.slice(0, 4000) ?? null,
    classes,
  };
}

function markEmphasis(root: Element): void {
  for (;;) {
    const leaf = [...root.querySelectorAll('span, strong')].find(
      (element) => !element.querySelector('span, strong'),
    );
    if (!leaf) return;
    const text = leaf.ownerDocument.createTextNode(emphasizeInline(leaf.tagName, leaf.textContent ?? ''));
    leaf.replaceWith(text);
  }
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
