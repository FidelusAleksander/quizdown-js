/**
 * Simple localization system to replace svelte-i18n.
 * Provides message translation based on locale.
 */

import en from './languages/en.json';
import de from './languages/de.json';
import fr from './languages/fr.json';
import es from './languages/es.json';

type LocaleKey = 'en' | 'de' | 'fr' | 'es';
type MessageKey = keyof typeof en;

const messages: Record<LocaleKey, Record<MessageKey, string>> = {
    en,
    de,
    fr,
    es,
};

let currentLocale: LocaleKey = 'en';

function getLocaleFromNavigator(): LocaleKey {
    if (typeof navigator === 'undefined') return 'en';
    const browserLocale = navigator.language?.split('-')[0] || 'en';
    if (browserLocale in messages) {
        return browserLocale as LocaleKey;
    }
    return 'en';
}

export function initLocale(locale: LocaleKey | null): void {
    currentLocale = locale === null ? getLocaleFromNavigator() : locale;
}

export function t(key: MessageKey): string {
    const localeMessages = messages[currentLocale] || messages.en;
    return localeMessages[key] || messages.en[key] || key;
}

export function getCurrentLocale(): LocaleKey {
    return currentLocale;
}
