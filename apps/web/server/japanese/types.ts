export type WordClass =
  | 'ichidan'
  | 'godan'
  | 'suru'
  | 'kuru'
  | 'iku'
  | 'aru'
  | 'i-adjective'
  | 'na-adjective';

export interface SurfaceForm {
  lemma: string;
  wordClass: WordClass;
  form: string;
  surface: string;
  mistaken: boolean;
  source: 'lexicon' | 'heuristic';
}

export interface Diagnosis {
  kind: 'conjugation' | 'structural' | 'unclear';
  summary: string;
  lemma: string | null;
  wordClass: WordClass | null;
  expectedForm: string | null;
  actualForm: string | null;
}
