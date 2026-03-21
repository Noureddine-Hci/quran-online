import { state }                      from '../state.js';
import { i18n }                       from '../i18n.js';
import { storage }                    from '../storage.js';
import { navigate }                   from '../router.js';
import { app, render, showLoading }   from '../dom.js';
import { fetchMushafPage }            from '../api.js';
import { Tajweed }                    from '../tajweed.js';

const tajweedParser = new Tajweed();
const TOTAL_PAGES   = 604;

// ── View ────────────────────────────────────────────────────────────────────────
export async function renderMushaf(pageNum) {
    const t    = i18n[state.currentLang];
    const page = Math.max(1, Math.min(TOTAL_PAGES, parseInt(pageNum) || 1));

    storage.set('currentMushafPage', page);
    showLoading();

    const [tajweedData, plainData] = await Promise.all([
        fetchMushafPage(page, 'quran-tajweed'),
        fetchMushafPage(page, 'quran-uthmani')
    ]);

    if (!tajweedData || !plainData) {
        render(app, `<div class="mushaf-error glass"><p>${t.error}</p>
            <button class="btn-primary" onclick="location.hash='#/'">${t.back}</button></div>`);
        return;
    }

    const tajweedOn = storage.get('tajweedOn', true);
    const ayahs     = tajweedData.ayahs;
    const plainAyahs = plainData.ayahs;

    // Group ayahs by surah
    const surahGroups = [];
    let currentSurah  = null;
    ayahs.forEach((ayah, i) => {
        if (!currentSurah || currentSurah.number !== ayah.surah.number) {
            currentSurah = ayah.surah;
            surahGroups.push({ surah: currentSurah, ayahs: [], plainAyahs: [] });
        }
        surahGroups[surahGroups.length - 1].ayahs.push(ayah);
        surahGroups[surahGroups.length - 1].plainAyahs.push(plainAyahs[i]);
    });

    // Build page content
    const pageContent = surahGroups.map(group => {
        const showBismillah = group.surah.number !== 1 && group.surah.number !== 9
            && group.ayahs[0].numberInSurah === 1;
        const surahHeader = group.ayahs[0].numberInSurah === 1
            ? `<div class="mushaf-surah-header">
                   <span class="mushaf-surah-name">${group.surah.name}</span>
               </div>` : '';
        const bismillah = showBismillah
            ? '<div class="mushaf-bismillah">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>' : '';

        const ayahsHtml = group.ayahs.map((ayah, i) => {
            const tajweedHtml = tajweedParser.parse(ayah.text);
            const plainText   = group.plainAyahs[i].text;
            const num         = ayah.numberInSurah;
            const marker      = `<span class="mushaf-ayah-num" aria-label="${t.ayah} ${num}">﴿${toArabicNum(num)}﴾</span>`;
            return `<span class="mushaf-ayah" data-surah="${ayah.surah.number}" data-ayah="${num}">`
                + `<span class="text-tajweed${tajweedOn ? '' : ' hidden'}">${tajweedHtml}</span>`
                + `<span class="text-plain${tajweedOn ? ' hidden' : ''}">${plainText}</span>`
                + marker + '</span>';
        }).join(' ');

        return surahHeader + bismillah + ayahsHtml;
    }).join('');

    render(app, `
        <div class="mushaf-wrapper">
            <div class="mushaf-toolbar glass">
                <button class="mushaf-nav-btn" id="mushaf-prev" ${page <= 1 ? 'disabled' : ''} aria-label="${t.mushafPrev}">→</button>
                <div class="mushaf-page-info">
                    <label for="mushaf-page-input" class="sr-only">${t.mushafGoTo}</label>
                    <input type="number" id="mushaf-page-input" class="mushaf-page-input glass"
                           value="${page}" min="1" max="${TOTAL_PAGES}" aria-label="${t.mushafGoTo}">
                    <span class="mushaf-page-total">/ ${TOTAL_PAGES}</span>
                </div>
                <button class="mushaf-nav-btn" id="mushaf-next" ${page >= TOTAL_PAGES ? 'disabled' : ''} aria-label="${t.mushafNext}">←</button>
                <button class="mushaf-tajweed-btn icon-btn ${tajweedOn ? 'active' : ''}" id="mushaf-tajweed-toggle" aria-label="Tajweed">🎨</button>
            </div>

            <div class="mushaf-page-container">
                <div class="mushaf-frame">
                    <div class="mushaf-page" lang="ar" dir="rtl">
                        ${pageContent}
                    </div>
                </div>
                <div class="mushaf-page-number">${t.mushafPage} ${page}</div>
            </div>

            <div class="mushaf-hint">${t.mushafClickAyah}</div>
        </div>
    `);

    // ── Event listeners ─────────────────────────────────────────────────────────
    document.getElementById('mushaf-prev').addEventListener('click', () => navigate(`/mushaf/${page - 1}`));
    document.getElementById('mushaf-next').addEventListener('click', () => navigate(`/mushaf/${page + 1}`));

    const pageInput = document.getElementById('mushaf-page-input');
    pageInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const val = parseInt(pageInput.value);
            if (val >= 1 && val <= TOTAL_PAGES) navigate(`/mushaf/${val}`);
        }
    });
    pageInput.addEventListener('blur', () => {
        const val = parseInt(pageInput.value);
        if (val >= 1 && val <= TOTAL_PAGES && val !== page) navigate(`/mushaf/${val}`);
    });

    // Tajweed toggle
    document.getElementById('mushaf-tajweed-toggle').addEventListener('click', () => {
        const on = !storage.get('tajweedOn', true);
        storage.set('tajweedOn', on);
        document.querySelectorAll('.text-tajweed').forEach(el => el.classList.toggle('hidden', !on));
        document.querySelectorAll('.text-plain').forEach(el => el.classList.toggle('hidden', on));
        document.getElementById('mushaf-tajweed-toggle').classList.toggle('active', on);
    });

    // Click ayah → go to surah reader
    document.querySelectorAll('.mushaf-ayah').forEach(el => {
        el.addEventListener('click', () => {
            const surahId = el.dataset.surah;
            navigate(`/surah/${surahId}`);
        });
    });

    // Keyboard navigation
    document.addEventListener('keydown', function mushafKeys(e) {
        if (e.target.tagName === 'INPUT') return;
        if (e.key === 'ArrowRight' && page > 1)           navigate(`/mushaf/${page - 1}`);
        if (e.key === 'ArrowLeft'  && page < TOTAL_PAGES)  navigate(`/mushaf/${page + 1}`);
    });

    // Swipe navigation (mobile)
    let touchStartX = 0;
    const container = document.querySelector('.mushaf-page-container');
    container.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    container.addEventListener('touchend', e => {
        const diff = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(diff) > 60) {
            if (diff > 0 && page > 1)           navigate(`/mushaf/${page - 1}`);
            if (diff < 0 && page < TOTAL_PAGES)  navigate(`/mushaf/${page + 1}`);
        }
    }, { passive: true });
}

// ── Helpers ─────────────────────────────────────────────────────────────────────
function toArabicNum(n) {
    return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}
