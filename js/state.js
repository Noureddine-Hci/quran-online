import { storage }    from './storage.js';
import { langConfig } from './i18n.js';

// Normalize the stored language once: an unknown code (legacy value, tampering,
// another app on the same origin) would otherwise crash every i18n[currentLang]
// lookup and the selectedTranslationId getter.
const storedLang = storage.get('lang', 'fr');
const safeLang   = langConfig[storedLang] ? storedLang : 'fr';

// Single mutable state object — importez et mutez directement ses propriétés
export const state = {
    surahs:       [],
    reciters:     [],
    currentLang:  safeLang,
    currentSurahId: null,
    lastSearchTerm: '',

    // Propriété dérivée : toujours synchronisée avec currentLang
    get selectedTranslationId() {
        return (langConfig[this.currentLang] || langConfig.fr).id;
    }
};
