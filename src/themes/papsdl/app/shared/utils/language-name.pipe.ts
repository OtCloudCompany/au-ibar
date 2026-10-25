import {
  Pipe,
  PipeTransform,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * AU-IBAR: discovery filters whose values are ISO language codes.
 * Their values are shown as language names; the stored/indexed value stays the code.
 */
export const LANGUAGE_FILTERS: string[] = ['language'];

/**
 * Shows an ISO 639 language code (e.g. "en", "fr", "pt_BR") as its name in the
 * current UI language, using the browser's built-in Intl.DisplayNames
 * ("en" -> "English" in English, "anglais" in French, "الإنجليزية" in Arabic).
 * Values that are not valid language codes are returned unchanged.
 * Impure so that it follows a UI language switch; results are cached.
 */
@Pipe({
  name: 'dsLanguageName',
  pure: false,
  standalone: true,
})
export class LanguageNamePipe implements PipeTransform {
  private static cache = new Map<string, string>();

  constructor(private translate: TranslateService) {
  }

  transform(code: string, uiLang?: string): string {
    if (!code) {
      return code;
    }
    const lang = uiLang || this.translate.currentLang || this.translate.defaultLang || 'en';
    const key = lang + '|' + code;
    let name = LanguageNamePipe.cache.get(key);
    if (name === undefined) {
      name = LanguageNamePipe.lookup(code, lang);
      LanguageNamePipe.cache.set(key, name);
    }
    return name;
  }

  static lookup(code: string, lang: string): string {
    const tag = code.trim().replace(/_/g, '-');
    if (!/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/.test(tag) || typeof Intl === 'undefined' || !(Intl as any).DisplayNames) {
      return code;
    }
    try {
      const names = new (Intl as any).DisplayNames([lang, 'en'], { type: 'language' });
      const name: string = names.of(tag);
      if (!name || name === 'root' || name.toLowerCase() === tag.toLowerCase()) {
        return code;
      }
      return name.charAt(0).toLocaleUpperCase(lang) + name.slice(1);
    } catch (e) {
      return code;
    }
  }
}
