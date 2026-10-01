/// <reference types="vitest/globals" />
import { applyRomaji } from './romaji-kana';

describe('applyRomaji', () => {
  it('converts completed syllables and leaves an unfinished prefix', () => {
    expect(applyRomaji('taberu')).toBe('たべる');
    expect(applyRomaji('tabe')).toBe('たべ');
    expect(applyRomaji('t')).toBe('t');
    expect(applyRomaji('tta')).toBe('った');
    expect(applyRomaji('tt')).toBe('っt');
    expect(applyRomaji('iku')).toBe('いく');
    expect(applyRomaji('shimasu')).toBe('します');
    expect(applyRomaji('kya')).toBe('きゃ');
    expect(applyRomaji('sh')).toBe('sh');
    expect(applyRomaji('ny')).toBe('ny');
  });

  it('handles n, sokuon aliases, and katakana', () => {
    expect(applyRomaji('n')).toBe('n');
    expect(applyRomaji('nn')).toBe('ん');
    expect(applyRomaji("n'")).toBe('ん');
    expect(applyRomaji('nka')).toBe('んか');
    expect(applyRomaji('shi')).toBe('し');
    expect(applyRomaji('si')).toBe('し');
    expect(applyRomaji('タベル')).toBe('たべる');
  });

  it('passes hiragana through and is idempotent', () => {
    expect(applyRomaji('たべる')).toBe('たべる');
    expect(applyRomaji(applyRomaji('taberu'))).toBe('たべる');
    expect(applyRomaji(applyRomaji('tta'))).toBe('った');
    expect(applyRomaji(applyRomaji('n'))).toBe('n');
  });
});
