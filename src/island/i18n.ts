import { useCallback } from 'react';
import { RU, RU_PATTERNS } from './i18n.ru';
import { useIslandStore } from './store';
import type { Language } from './types';

/*
 * Source strings are English. Russian comes from one dictionary keyed by the English text, so
 * views keep readable literals and an untranslated string simply stays English.
 */

export function translate(text: string, language: Language = useIslandStore.getState().settings.language): string {
  if (language === 'en') return text;
  const exact = RU[text];
  if (exact !== undefined) return exact;
  for (const [pattern, render] of RU_PATTERNS) {
    const match = pattern.exec(text);
    if (match) return render(match);
  }
  return text;
}

export function useLanguage(): Language {
  return useIslandStore((state) => state.settings.language);
}

/** A translate function that re-renders its component when the language changes. */
export function useT(): (text: string) => string {
  const language = useLanguage();
  return useCallback((text: string) => translate(text, language), [language]);
}

/** Translated text node: `<T>Paused</T>`. */
export function T({ children }: { children: string }) {
  return useT()(children);
}
