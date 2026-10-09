import { appendFormatted, type BadTranslation } from './bad-translations';

export function fillBadTranslationList(
  body: HTMLTableSectionElement,
  items: readonly BadTranslation[],
  onRemove: (id: string) => void,
): void {
  const doc = body.ownerDocument;
  body.replaceChildren();
  if (items.length === 0) {
    const row = doc.createElement('tr');
    const cell = doc.createElement('td');
    cell.colSpan = 4;
    cell.textContent = 'No flagged translations.';
    row.append(cell);
    body.append(row);
    return;
  }
  for (const entry of items) {
    const row = doc.createElement('tr');
    const question = doc.createElement('td');
    question.lang = 'ja';
    question.textContent = entry.question;
    const official = doc.createElement('td');
    official.textContent = entry.nuance ? `${entry.translation} (${entry.nuance})` : entry.translation;
    const yours = doc.createElement('td');
    appendFormatted(yours, entry.alternative, doc);
    const action = doc.createElement('td');
    const remove = doc.createElement('button');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Remove ${entry.question}`);
    remove.append(trashIcon(doc));
    remove.addEventListener('click', () => onRemove(entry.id));
    action.append(remove);
    row.append(question, official, yours, action);
    body.append(row);
  }
}

function trashIcon(doc: Document): SVGSVGElement {
  const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('aria-hidden', 'true');
  const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill', 'currentColor');
  path.setAttribute('d', 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6zm13-14h-3.5l-1-1h-5l-1 1H5v2h14z');
  svg.append(path);
  return svg;
}
