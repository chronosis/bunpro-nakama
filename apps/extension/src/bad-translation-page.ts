import {
  appendFormatted,
  findBadTranslation,
  isSrsLabel,
  type BadTranslation,
} from './bad-translations';

export interface QuizSurface {
  question: string;
  translation: string;
  nuance: string | null;
  translationNode: HTMLElement;
  nuanceNode: HTMLElement | null;
}

const DROP_FROM_QUESTION = '.bp-quiz-tense, rt, .nakama-warn, .nakama-alt';
const DROP_FROM_TRANSLATION =
  '.nakama-warn, .nakama-alt, .QuestionSentenceTransNuance, .bp-quiz-trans--hint';

export function readQuizSurface(root: ParentNode): QuizSurface | null {
  const questionNode = root.querySelector<HTMLElement>('.bp-quiz-question');
  const wrap = root.querySelector<HTMLElement>('.bp-quiz-trans-wrap');
  if (!questionNode || !wrap) return null;
  const translationNode =
    wrap.querySelector<HTMLElement>('.bp-quiz-trans:not(.bp-quiz-trans--hint)') ?? wrap;
  const question = collapse(plainText(questionNode, DROP_FROM_QUESTION));
  const translation = collapse(plainText(translationNode, DROP_FROM_TRANSLATION));
  if (!question || !translation) return null;
  const nuanceCandidate = root.querySelector<HTMLElement>('.QuestionSentenceTransNuance');
  const nuanceNode = nuanceCandidate && nuanceCandidate !== wrap ? nuanceCandidate : null;
  return {
    question,
    translation,
    nuance: nuanceNode ? collapse(nuanceNode.textContent ?? '') || null : null,
    translationNode,
    nuanceNode,
  };
}

export function paintTranslations(root: ParentNode, items: readonly BadTranslation[]): void {
  const surface = readQuizSurface(root);
  if (!surface) {
    clearTranslationNotes(root);
    return;
  }
  const match = findBadTranslation(items, surface.question, surface.translation);
  if (!match) {
    clearTranslationNotes(root);
    return;
  }
  ensureWarning(surface.translationNode);
  ensureAlternative(surface.translationNode, match.alternative);
}

export function clearNakamaUi(root: ParentNode): void {
  clearTranslationNotes(root);
  const button = root.querySelector('[data-nakama-flag]');
  const item = button?.closest('li.nakama-flag-item');
  if (item) item.remove();
  else button?.remove();
  root.querySelector('.nakama-modal-backdrop')?.remove();
}

export function findSrsAnchor(root: ParentNode): HTMLElement | null {
  const titled = root.querySelector<HTMLElement>('[title="Your SRS progress"]');
  if (titled) return titled;

  const headers = [...root.querySelectorAll<HTMLElement>('#js-rev-header, header')];
  for (const header of headers) {
    const match = [...header.querySelectorAll<HTMLElement>('*')].find((node) => {
      if (node === header) return false;
      const label = node.getAttribute('aria-label') || node.getAttribute('title') || ownText(node);
      return isSrsLabel(label);
    });
    if (match) return widenSrsAnchor(header, match);
  }

  const reviewHeader = root.querySelector<HTMLElement>('#js-rev-header');
  if (!reviewHeader) return null;
  const right = reviewHeader.lastElementChild;
  if (!(right instanceof HTMLElement) || right === reviewHeader.firstElementChild) return null;
  const last = right.lastElementChild;
  return right.childElementCount > 1 && last instanceof HTMLElement ? last : right;
}

export function ensureFlagButton(root: ParentNode, onFlag: () => void): void {
  const anchor = findSrsAnchor(root);
  const existing = root.querySelector<HTMLButtonElement>('[data-nakama-flag]');
  if (!anchor?.parentElement) {
    existing?.closest('li.nakama-flag-item')?.remove();
    existing?.remove();
    return;
  }
  const doc = anchor.ownerDocument;
  ensureStyle(doc);
  const button = existing ?? createFlagButton(doc, onFlag);
  bindFlagButton(button, onFlag);
  const inList = anchor.parentElement.tagName === 'UL';
  const slot: HTMLElement = inList
    ? (button.closest('li.nakama-flag-item') ?? wrapFlagButton(doc, button))
    : button;
  if (!inList) button.closest('li.nakama-flag-item')?.replaceWith(button);
  if (slot.nextElementSibling !== anchor) anchor.parentElement.insertBefore(slot, anchor);
}

export function openTranslationModal(
  doc: Document,
  surface: QuizSurface | null,
  existing: BadTranslation | null,
  onSave: (alternative: string) => void,
  onClose?: () => void,
): void {
  doc.querySelector('.nakama-modal-backdrop')?.remove();
  ensureStyle(doc);
  const backdrop = doc.createElement('div');
  backdrop.className = 'nakama-modal-backdrop';
  backdrop.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:2147483647',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'background:rgba(0,0,0,.45)',
  ].join(';');
  const dialog = doc.createElement('div');
  dialog.className = 'nakama-modal';
  dialog.style.cssText = [
    'width:min(32rem, calc(100% - 2rem))',
    'max-height:calc(100% - 2rem)',
    'overflow:auto',
    'padding:16px',
    'border-radius:12px',
    'background:#fff',
    'color:#1d1a16',
  ].join(';');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'nakama-modal-title');

  const dismiss = () => {
    backdrop.remove();
    onClose?.();
  };

  const title = doc.createElement('h2');
  title.id = 'nakama-modal-title';
  title.textContent = 'Better translation';
  dialog.append(title);

  if (!surface) {
    const empty = doc.createElement('p');
    empty.textContent = 'This page has no quiz translation to flag.';
    dialog.append(empty);
  } else {
    const question = doc.createElement('p');
    question.className = 'nakama-modal-question';
    question.lang = 'ja';
    question.textContent = surface.question;
    const official = doc.createElement('p');
    official.className = 'nakama-modal-official';
    official.textContent = surface.translation;
    dialog.append(question, official);
    if (surface.nuanceNode) {
      const nuance = doc.createElement('p');
      nuance.className = 'nakama-modal-nuance';
      copyNuance(surface.nuanceNode, nuance, doc);
      dialog.append(nuance);
    }
    const label = doc.createElement('label');
    label.textContent = 'Alternative translation';
    const field = doc.createElement('textarea');
    field.rows = 4;
    field.value = existing?.alternative ?? '';
    label.append(field);
    const hint = doc.createElement('p');
    hint.className = 'nakama-modal-hint';
    hint.textContent = 'Wrap the word that should be emphasized with **double asterisks**.';
    const error = doc.createElement('p');
    error.className = 'nakama-modal-error';
    error.hidden = true;
    dialog.append(label, hint, error);

    const save = doc.createElement('button');
    save.type = 'button';
    save.className = 'nakama-modal-save';
    save.textContent = 'Save';
    save.addEventListener('click', () => {
      const alternative = field.value.trim();
      if (!alternative) {
        error.hidden = false;
        error.textContent = 'Enter a translation before saving.';
        return;
      }
      onSave(alternative);
      dismiss();
    });
    dialog.append(save);
    queueMicrotask(() => field.focus());
  }

  const close = doc.createElement('button');
  close.type = 'button';
  close.className = 'nakama-modal-close';
  close.textContent = 'Close';
  close.addEventListener('click', dismiss);
  dialog.append(close);

  backdrop.addEventListener('click', (event) => {
    event.stopPropagation();
    if (event.target === backdrop) dismiss();
  });
  backdrop.addEventListener('keydown', (event) => {
    event.stopPropagation();
    if (event.key === 'Escape') dismiss();
  });
  backdrop.append(dialog);
  dialog.addEventListener('click', (event) => event.stopPropagation());
  doc.body.append(backdrop);
}

function ensureWarning(translationNode: HTMLElement): void {
  if (translationNode.querySelector(':scope > .nakama-warn')) return;
  const warn = translationNode.ownerDocument.createElement('span');
  warn.className = 'nakama-warn';
  warn.textContent = '⚠️';
  warn.setAttribute('role', 'img');
  warn.setAttribute('aria-label', 'Flagged translation');
  translationNode.prepend(warn);
}

function ensureAlternative(translationNode: HTMLElement, alternative: string): void {
  const doc = translationNode.ownerDocument;
  const insideWrap = translationNode.classList.contains('bp-quiz-trans-wrap');
  const current = insideWrap
    ? translationNode.querySelector(':scope > .nakama-alt')
    : translationNode.nextElementSibling;
  if (current?.classList.contains('nakama-alt') && current.getAttribute('data-source') === alternative) {
    return;
  }
  if (current?.classList.contains('nakama-alt')) current.remove();
  const alt = doc.createElement('p');
  alt.className = 'nakama-alt prose-strong:text-primary-accent';
  alt.lang = 'en';
  alt.setAttribute('data-source', alternative);
  appendFormatted(alt, alternative, doc);
  if (insideWrap) translationNode.append(alt);
  else translationNode.insertAdjacentElement('afterend', alt);
}

function clearTranslationNotes(root: ParentNode): void {
  root.querySelectorAll('.nakama-warn, .nakama-alt').forEach((node) => node.remove());
}

function widenSrsAnchor(header: HTMLElement, node: HTMLElement): HTMLElement {
  let current = node;
  while (
    current.parentElement &&
    current.parentElement !== header &&
    header.contains(current.parentElement) &&
    current.parentElement.childElementCount === 1
  ) {
    current = current.parentElement;
  }
  return current;
}

const boundFlagButtons = new WeakSet<HTMLButtonElement>();

function bindFlagButton(button: HTMLButtonElement, onFlag: () => void): void {
  button.title = 'Flag this translation';
  button.setAttribute('aria-label', 'Flag this translation');
  if (boundFlagButtons.has(button)) return;
  boundFlagButtons.add(button);
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onFlag();
  });
}

function createFlagButton(doc: Document, onFlag: () => void): HTMLButtonElement {
  const button = doc.createElement('button');
  button.type = 'button';
  button.className = 'nakama-flag';
  button.dataset.nakamaFlag = 'true';
  button.append(flagIcon(doc));
  bindFlagButton(button, onFlag);
  return button;
}

function wrapFlagButton(doc: Document, button: HTMLButtonElement): HTMLLIElement {
  const item = doc.createElement('li');
  item.className = 'nakama-flag-item';
  item.style.display = 'flex';
  item.style.alignItems = 'center';
  item.append(button);
  return item;
}

function flagIcon(doc: Document): SVGSVGElement {
  const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('aria-hidden', 'true');
  const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('d', 'M6 3h2v18H6zm2 1h11l-2.5 4L19 12H8z');
  svg.append(path);
  return svg;
}

function copyNuance(source: HTMLElement, target: HTMLElement, doc: Document): void {
  const walk = (node: Node, into: HTMLElement) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        into.append(doc.createTextNode(child.textContent ?? ''));
        return;
      }
      if (!(child instanceof HTMLElement)) return;
      if (child.tagName === 'STRONG') {
        const strong = doc.createElement('strong');
        strong.textContent = child.textContent ?? '';
        into.append(strong);
        return;
      }
      walk(child, into);
    });
  };
  walk(source, target);
}

function plainText(node: HTMLElement, drop: string): string {
  const copy = node.cloneNode(true) as HTMLElement;
  copy.querySelectorAll(drop).forEach((element) => element.remove());
  return copy.textContent ?? '';
}

function ownText(element: HTMLElement): string {
  return [...element.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent ?? '')
    .join('');
}

function collapse(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function ensureStyle(doc: Document): void {
  if (doc.getElementById('nakama-injected-style')) return;
  const style = doc.createElement('style');
  style.id = 'nakama-injected-style';
  style.textContent = `
    .nakama-flag {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin: 0 4px 0 0;
      padding: 0;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: inherit;
      cursor: pointer;
      box-shadow: none;
    }
    .nakama-flag:hover { background: rgba(127, 127, 127, 0.16); }
    li.nakama-flag-item { display: flex; align-items: center; list-style: none; }
    .nakama-warn { margin-right: 0.35em; }
    .nakama-alt { display: block; flex-basis: 100%; width: 100%; margin: 0.35em 0 0; }
    .nakama-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.45);
    }
    .nakama-modal {
      width: min(32rem, calc(100% - 2rem));
      max-height: calc(100% - 2rem);
      overflow: auto;
      padding: 16px;
      border-radius: 12px;
      background: #fff;
      color: #1d1a16;
      font: 14px/1.4 "Segoe UI", sans-serif;
    }
    .nakama-modal h2 { margin: 0 0 8px; font-size: 18px; }
    .nakama-modal p { margin: 0 0 8px; }
    .nakama-modal label { display: grid; gap: 4px; margin-bottom: 8px; }
    .nakama-modal textarea {
      width: 100%;
      box-sizing: border-box;
      font: inherit;
    }
    .nakama-modal-hint { color: #5c564e; font-size: 12px; }
    .nakama-modal-error { color: #9c3b3b; }
    .nakama-modal button {
      margin-right: 8px;
      border: 0;
      border-radius: 8px;
      padding: 8px 10px;
      cursor: pointer;
    }
    .nakama-modal-save { background: #9c3b3b; color: white; }
    .nakama-modal-close { background: transparent; color: #1d1a16; }
  `;
  doc.head.append(style);
}
