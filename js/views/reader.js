import { state }                        from '../state.js';
import { i18n }                         from '../i18n.js';
import { storage }                      from '../storage.js';
import { navigate }                     from '../router.js';
import { app, render, showLoading }     from '../dom.js';
import { fetchSurahDetail, fetchTranslation, fetchAudio, fetchTransliteration, fetchTafsir, fetchWordTimestamps, fetchVerseWords } from '../api.js';
import { isBookmarked, toggleBookmark } from './bookmarks.js';
import { recordAyahRead }               from './stats.js';
import { Tajweed }                      from '../tajweed.js';

// ── Tajweed parser instance ────────────────────────────────────────────────────
const tajweedParser = new Tajweed();

// ── Tajweed legend (localized FR/EN) ───────────────────────────────────────────
const TAJWEED_LEGEND = {
    ham_wasl:          { fr: ['Hamza Wasl',           'Liaison silencieuse'],           en: ['Hamza Wasl',           'Silent connection']              },
    slnt:              { fr: ['Lettre silencieuse',   'Ne se prononce pas'],            en: ['Silent letter',        'Not pronounced']                 },
    madda_normal:      { fr: ['Madd normal',          'Allongement 2 temps'],           en: ['Normal Madd',          '2 beats elongation']             },
    madda_permissible: { fr: ['Madd permissible',     'Allongement 2 ou 4 temps'],      en: ['Permissible Madd',     '2 or 4 beats elongation']        },
    madda_necessary:   { fr: ['Madd nécessaire',      'Allongement 6 temps'],           en: ['Necessary Madd',       '6 beats elongation']             },
    qlq:               { fr: ['Qalqala',              'Vibration légère à l\'arrêt'],   en: ['Qalqala',              'Slight echo at stop']            },
    madda_obligatory:  { fr: ['Madd obligatoire',     'Allongement 4 ou 5 temps'],      en: ['Obligatory Madd',      '4 or 5 beats elongation']        },
    ikhf_shfw:         { fr: ['Ikhfa Shafawi',        'Nasalisation labiale cachée'],   en: ['Ikhfa Shafawi',        'Hidden labial nasalization']      },
    ikhf:              { fr: ['Ikhfa',                'Prononciation cachée nasale'],   en: ['Ikhfa',                'Hidden nasal pronunciation']     },
    idghm_shfw:        { fr: ['Idgham Shafawi',       'Fusion labiale avec nasalisation'], en: ['Idgham Shafawi',    'Labial merger with nasalization'] },
    iqlb:              { fr: ['Iqlab',                'Noun → Mim avec ghunna'],        en: ['Iqlab',                'Noon → Meem with ghunna']        },
    idgh_ghn:          { fr: ['Idgham avec Ghunna',   'Fusion avec nasalisation 2t'],   en: ['Idgham with Ghunna',   'Merger with 2-beat nasalization'] },
    idgh_w_ghn:        { fr: ['Idgham sans Ghunna',   'Fusion sans nasalisation'],      en: ['Idgham w/o Ghunna',    'Merger without nasalization']     },
    idgh_mus:          { fr: ['Idgham Mutajanisayn',  'Fusion de lettres similaires'],  en: ['Idgham Mutajanisayn',  'Merger of similar letters']      },
    ghn:               { fr: ['Ghunna',               'Nasalisation 2 temps'],          en: ['Ghunna',               '2-beat nasalization']            }
};

// ── Localize tajweed tooltip descriptions using TAJWEED_LEGEND ───────────────
function localizeDescription(parsedHtml, lang) {
    return tajweedParser.getMeta().reduce((html, meta) => {
        const legend = TAJWEED_LEGEND[meta.default_css_class];
        if (!legend) return html;
        const localName = lang === 'fr' ? legend.fr[0] : legend.en[0];
        const escaped = meta.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return html.replace(
            new RegExp(`data-description="${escaped}"`, 'g'),
            `data-description="${localName}"`
        );
    }, parsedHtml);
}

// ── SVG icons ──────────────────────────────────────────────────────────────────
const ICON_PLAY  = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
const ICON_LOOP  = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>';
const ICON_SHARE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
const ICON_CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
const ICON_EYE   = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

// ── View ───────────────────────────────────────────────────────────────────────
export async function renderSurahReader(id) {
    if (window._readerAbort) window._readerAbort.abort();
    window._readerAbort = new AbortController();
    const readerSignal = window._readerAbort.signal;

    const t = i18n[state.currentLang];
    state.currentSurahId = id;
    showLoading();

    const [arabicData, arabicPlain, translationData, translitData, verseWords] = await Promise.all([
        fetchSurahDetail(id, 'quran-tajweed'),
        fetchSurahDetail(id, 'quran-uthmani'),
        fetchTranslation(id, state.selectedTranslationId),
        fetchTransliteration(id),
        fetchVerseWords(id)
    ]);

    if (!arabicData || !arabicPlain || !translationData) {
        render(app, `<div class="error">${t.error}</div>`);
        return;
    }

    const savedReciter     = storage.get('reciter', 'ar.alafasy');
    const savedReciterName = state.reciters.find(r => r.identifier === savedReciter)?.name || 'Mishary Rashid Alafasy';
    const revType          = arabicData.revelationType === 'Meccan' ? t.meccan : t.medinan;
    const tajweedOn        = storage.get('tajweedOn', true);
    const translitOn       = storage.get('translitOn', false);
    const savedSpeed       = storage.get('audioSpeed', 1);
    const memMode          = storage.get('memMode', false);

    const reciterOptions = state.reciters.map(r => {
        const sel      = r.identifier === savedReciter ? 'data-selected="true"' : '';
        const typeTag  = r.type === 'versebyverse' ? '' : ' <span class="reciter-type-tag">sourate</span>';
        return `<div class="custom-option" data-value="${r.identifier}" data-type="${r.type}" ${sel}>
                    <span class="option-name">${r.name}${typeTag}</span>
                    <span class="option-sub">${r.englishName}</span>
                </div>`;
    }).join('');

    // ── Tajweed legend items ──────────────────────────────────────────────────
    const legendItems = Object.entries(TAJWEED_LEGEND)
        .map(([cls, rule]) => {
            const [name, desc] = state.currentLang === 'fr' ? rule.fr : rule.en;
            return `<div class="legend-item">
                <span class="legend-dot ${cls}">&#x25CF;</span>
                <span class="legend-name">${name}</span>
                <span class="legend-desc">${desc}</span>
            </div>`;
        }).join('');

    // ── Pré-calcul des deux versions de texte ─────────────────────────────────
    const tajweedTexts = arabicData.ayahs.map(a => localizeDescription(tajweedParser.parse(a.text), state.currentLang));
    const plainTexts   = arabicPlain.ayahs.map(a => a.text);

    // ── Word-by-word spans (for highlighting) ───────────────────────────────
    const wbwTexts = arabicData.ayahs.map((ayah, index) => {
        const verse = verseWords?.[index];
        if (!verse?.words) return plainTexts[index];
        return verse.words
            .filter(w => w.char_type_name === 'word')
            .map(w => `<span class="wbw-word" data-verse="${id}:${ayah.numberInSurah}" data-word="${w.position}">${w.text_uthmani || w.text}</span>`)
            .join(' ');
    });

    // ── Ayah cards ────────────────────────────────────────────────────────────
    const ayahCards = arabicData.ayahs.map((ayah, index) => {
        const bookmarked   = isBookmarked(id, ayah.numberInSurah);
        const fillVal      = bookmarked ? 'currentColor' : 'none';
        const activeClass  = bookmarked ? 'active' : '';
        const translitText = translitData?.ayahs?.[index]?.text || '';
        const memClass     = memMode ? ' mem-hidden' : '';
        return `<div class="ayah-card glass" id="ayah-${index}" data-ayah-num="${ayah.numberInSurah}"
                     role="article" aria-label="${t.ayah} ${ayah.numberInSurah}">
                    <div class="ayah-card-header">
                        <div class="surah-number" aria-hidden="true">${ayah.numberInSurah}</div>
                        <div class="ayah-actions">
                            <button class="loop-btn icon-btn" data-index="${index}" aria-label="${t.loopAyah}" title="${t.loopAyah}">${ICON_LOOP}</button>
                            <button class="share-btn icon-btn" data-index="${index}" aria-label="${t.share}" title="${t.share}">${ICON_SHARE}</button>
                            <button class="bookmark-btn icon-btn ${activeClass}" data-ayah="${ayah.numberInSurah}"
                                    aria-label="${t.ayah} ${ayah.numberInSurah} — ${t.bookmarks}" aria-pressed="${bookmarked}">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="${fillVal}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="ayah-text${memClass}" lang="ar">
                        <span class="text-tajweed${tajweedOn ? '' : ' hidden'}">${tajweedTexts[index]}</span>
                        <span class="text-plain${tajweedOn ? ' hidden' : ''}">${plainTexts[index]}</span>
                        <span class="text-wbw hidden">${wbwTexts[index]}</span>
                    </div>
                    ${translitText ? `<div class="ayah-translit${translitOn ? '' : ' hidden'}">${translitText}</div>` : ''}
                    <div class="ayah-translation">${translationData.ayahs[index].text}</div>
                    <div class="tafsir-body hidden" data-index="${index}"></div>
                </div>`;
    }).join('');

    const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    render(app, `
        <div class="reader-container">
            <div class="hero glass" style="margin-top:2rem;margin-bottom:2rem;padding:2rem;">
                <h2 class="surah-name-ar" style="font-size:3rem;" lang="ar">${arabicData.name}</h2>
                <h3 style="color:var(--accent);">${arabicData.englishName}</h3>
                <p>${arabicData.englishNameTranslation} &bull; ${revType} &bull; ${arabicData.numberOfAyahs} ${t.versets}</p>

                <div class="jump-to-ayah">
                    <label for="jump-input">${t.jumpLabel}</label>
                    <input type="number" id="jump-input" min="1" max="${arabicData.numberOfAyahs}" placeholder="${t.jumpPlaceholder}" class="glass">
                    <button id="jump-btn" class="glass">${t.jumpGo}</button>
                </div>

                <!-- Reader toggles -->
                <div class="reader-toggles">
                    <button id="tajweed-toggle" class="toggle-btn${tajweedOn ? ' active' : ''}" aria-pressed="${tajweedOn}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>
                        Tajweed
                    </button>
                    <button id="translit-toggle" class="toggle-btn${translitOn ? ' active' : ''}" aria-pressed="${translitOn}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
                        ${t.translitToggle}
                    </button>
                    <button id="legend-toggle" class="toggle-btn" aria-expanded="false">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        ${t.tajweedLegend}
                    </button>
                    <button id="mem-toggle" class="toggle-btn${memMode ? ' active' : ''}" aria-pressed="${memMode}">
                        ${ICON_EYE} ${t.memMode}
                    </button>
                    <button id="range-repeat-toggle" class="toggle-btn" aria-expanded="false">
                        ${ICON_LOOP} ${t.rangeRepeat}
                    </button>
                    <button id="wbw-toggle" class="toggle-btn" aria-pressed="false">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        ${t.wordByWord}
                    </button>
                    <div class="speed-btns" role="group" aria-label="${t.speedLabel}">
                        <span class="speed-label">${t.speedLabel}</span>
                        ${speedOptions.map(s => `<button class="speed-btn${s === savedSpeed ? ' active' : ''}" data-speed="${s}">×${s}</button>`).join('')}
                    </div>
                    <div class="font-size-controls">
                        <button class="font-size-btn" id="font-decrease" aria-label="${state.currentLang === 'fr' ? 'Réduire la taille' : 'Decrease size'}">−</button>
                        <span class="font-size-label" id="font-size-val">${storage.get('arabicFontSize', 100)}%</span>
                        <button class="font-size-btn" id="font-increase" aria-label="${state.currentLang === 'fr' ? 'Augmenter la taille' : 'Increase size'}">+</button>
                    </div>
                    <button id="oled-toggle" class="toggle-btn${storage.get('oled', false) ? ' active' : ''}" aria-pressed="${storage.get('oled', false)}">
                        OLED
                    </button>
                </div>

                <!-- Tajweed legend -->
                <div id="tajweed-legend-panel" class="tajweed-legend glass hidden" aria-hidden="true">
                    <div class="legend-grid">${legendItems}</div>
                </div>

                <!-- Range repeat panel -->
                <div id="range-repeat-panel" class="range-repeat-panel glass hidden" aria-hidden="true">
                    <div class="range-repeat-row">
                        <label>${t.rangeFrom}
                            <input type="number" id="range-from" class="range-input glass" min="1" max="${arabicData.numberOfAyahs}" value="1">
                        </label>
                        <label>${t.rangeTo}
                            <input type="number" id="range-to" class="range-input glass" min="1" max="${arabicData.numberOfAyahs}" value="${arabicData.numberOfAyahs}">
                        </label>
                        <label>${t.rangeTimes}
                            <input type="number" id="range-times" class="range-input glass" min="1" max="99" value="3">
                        </label>
                    </div>
                    <div class="range-repeat-actions">
                        <button id="range-start-btn" class="btn-primary">${t.rangeStart}</button>
                        <button id="range-stop-btn" class="btn-secondary hidden">${t.rangeStop}</button>
                        <span id="range-status" class="range-status"></span>
                    </div>
                </div>

                <!-- Audio controls -->
                <div class="audio-controls" style="margin-top:1.5rem;display:flex;flex-direction:column;align-items:center;gap:1rem;">
                    <div class="custom-select-wrapper" style="width:100%;max-width:400px;">
                        <label style="font-size:0.9rem;font-weight:500;margin-bottom:0.5rem;display:block;color:var(--text-muted);">${t.reciterLabel}</label>
                        <div id="reciter-custom-select" class="custom-select glass">
                            <div class="custom-select-trigger">
                                <span id="selected-reciter-name">${savedReciterName}</span>
                                <div class="arrow"></div>
                            </div>
                            <div class="custom-options glass">${reciterOptions}</div>
                        </div>
                    </div>
                    <audio id="surah-audio" style="display:none;" aria-hidden="true"></audio>
                    <button id="play-surah-btn" class="glass" style="padding:0.8rem 2rem;cursor:pointer;color:white;border-radius:50px;background:var(--primary);display:flex;align-items:center;gap:0.5rem;border:none;font-weight:600;">
                        ${ICON_PLAY} ${t.listen}
                    </button>
                    <div id="audio-status" style="font-size:0.9rem;color:var(--text-muted);" aria-live="polite" aria-atomic="true">${t.ready}</div>
                </div>

                <button id="back-btn" class="glass" style="margin-top:2rem;padding:0.5rem 1rem;cursor:pointer;color:white;border-radius:8px;">${t.back}</button>
            </div>
            <!-- Sticky mini player -->
            <div id="sticky-player" class="sticky-player hidden">
                <button id="sticky-play-btn" class="sticky-play-btn">${ICON_PLAY}</button>
                <div id="sticky-status" class="sticky-status">${t.ready}</div>
                <button id="sticky-stop-btn" class="sticky-stop-btn">✕</button>
            </div>
            <div class="ayah-list">${ayahCards}</div>
            <div class="swipe-hint">← ${state.currentLang === 'fr' ? 'Glissez pour changer de sourate' : 'Swipe to change surah'} →</div>
        </div>
    `);

    // ── Back ───────────────────────────────────────────────────────────────────
    document.getElementById('back-btn').addEventListener('click', () => {
        if (window.history.length > 1) history.back();
        else navigate('/');
    });

    // ── Jump to ayah ──────────────────────────────────────────────────────────
    const jumpInput = document.getElementById('jump-input');
    const doJump = () => {
        const n = parseInt(jumpInput.value, 10) - 1;
        if (!isNaN(n) && n >= 0 && n < arabicData.ayahs.length)
            document.getElementById(`ayah-${n}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    document.getElementById('jump-btn').addEventListener('click', doJump);
    jumpInput.addEventListener('keydown', e => { if (e.key === 'Enter') doJump(); });

    // ── Tajweed toggle ────────────────────────────────────────────────────────
    document.getElementById('tajweed-toggle').addEventListener('click', function () {
        const on = !this.classList.contains('active');
        this.classList.toggle('active', on);
        this.setAttribute('aria-pressed', String(on));
        storage.set('tajweedOn', on);
        document.querySelectorAll('.text-tajweed').forEach(el => el.classList.toggle('hidden', !on));
        document.querySelectorAll('.text-plain').forEach(el => el.classList.toggle('hidden', on));
        if (!on) {
            document.getElementById('tajweed-legend-panel').classList.add('hidden');
            document.getElementById('legend-toggle').classList.remove('active');
            document.getElementById('legend-toggle').setAttribute('aria-expanded', 'false');
        }
    });

    // ── Transliteration toggle ────────────────────────────────────────────────
    document.getElementById('translit-toggle').addEventListener('click', function () {
        const on = !this.classList.contains('active');
        this.classList.toggle('active', on);
        this.setAttribute('aria-pressed', String(on));
        storage.set('translitOn', on);
        document.querySelectorAll('.ayah-translit').forEach(el => el.classList.toggle('hidden', !on));
    });

    // ── Legend toggle ─────────────────────────────────────────────────────────
    document.getElementById('legend-toggle').addEventListener('click', function () {
        const panel = document.getElementById('tajweed-legend-panel');
        const shown = !panel.classList.contains('hidden');
        panel.classList.toggle('hidden', shown);
        panel.setAttribute('aria-hidden', String(shown));
        this.classList.toggle('active', !shown);
        this.setAttribute('aria-expanded', String(!shown));
    });

    // ── Memorisation mode ─────────────────────────────────────────────────────
    document.getElementById('mem-toggle').addEventListener('click', function () {
        const on = !this.classList.contains('active');
        this.classList.toggle('active', on);
        this.setAttribute('aria-pressed', String(on));
        storage.set('memMode', on);
        document.querySelectorAll('.ayah-text').forEach(el => el.classList.toggle('mem-hidden', on));
        document.querySelectorAll('.mem-reveal-btn').forEach(b => b.classList.toggle('hidden', !on));
    });

    // Reveal individual ayah in mem mode
    document.querySelectorAll('.ayah-text').forEach((el, i) => {
        const card = el.closest('.ayah-card');
        const revealBtn = document.createElement('button');
        revealBtn.className = `mem-reveal-btn toggle-btn${memMode ? '' : ' hidden'}`;
        revealBtn.textContent = t.memReveal;
        revealBtn.addEventListener('click', () => {
            el.classList.toggle('mem-hidden');
            revealBtn.textContent = el.classList.contains('mem-hidden') ? t.memReveal : t.memHideAll;
        });
        card.querySelector('.ayah-card-header').after(revealBtn);
    });

    // ── Speed buttons ─────────────────────────────────────────────────────────
    const audioPlayer = document.getElementById('surah-audio');
    audioPlayer.playbackRate = savedSpeed;

    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const speed = parseFloat(btn.dataset.speed);
            storage.set('audioSpeed', speed);
            audioPlayer.playbackRate = speed;
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // ── Font size controls ─────────────────────────────────────────────────────
    const fontSizeVal = document.getElementById('font-size-val');
    let currentFontSize = storage.get('arabicFontSize', 100);

    const applyFontSize = () => {
        document.querySelectorAll('.ayah-text').forEach(el => {
            el.style.fontSize = `${currentFontSize}%`;
        });
        if (fontSizeVal) fontSizeVal.textContent = `${currentFontSize}%`;
    };
    applyFontSize();

    document.getElementById('font-decrease')?.addEventListener('click', () => {
        if (currentFontSize > 60) { currentFontSize -= 10; storage.set('arabicFontSize', currentFontSize); applyFontSize(); }
    });
    document.getElementById('font-increase')?.addEventListener('click', () => {
        if (currentFontSize < 200) { currentFontSize += 10; storage.set('arabicFontSize', currentFontSize); applyFontSize(); }
    });

    // ── OLED toggle ──────────────────────────────────────────────────────────────
    document.getElementById('oled-toggle')?.addEventListener('click', function () {
        const on = !this.classList.contains('active');
        this.classList.toggle('active', on);
        this.setAttribute('aria-pressed', String(on));
        storage.set('oled', on);
        if (on) document.documentElement.setAttribute('data-oled', 'true');
        else document.documentElement.removeAttribute('data-oled');
    });

    // ── Bookmark buttons ──────────────────────────────────────────────────────
    document.querySelectorAll('.bookmark-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const ayahNum = parseInt(btn.dataset.ayah, 10);
            const added   = toggleBookmark(id, ayahNum);
            btn.classList.toggle('active', added);
            btn.querySelector('svg').setAttribute('fill', added ? 'currentColor' : 'none');
            btn.setAttribute('aria-pressed', String(added));
        });
    });

    // ── Tafsir accordion ──────────────────────────────────────────────────────
    let tafsirCache = null;
    document.querySelectorAll('.ayah-translation').forEach((el, index) => {
        const tafsirBtn = document.createElement('button');
        tafsirBtn.className = 'tafsir-toggle-btn';
        tafsirBtn.textContent = `▸ ${t.tafsirToggle}`;
        tafsirBtn.setAttribute('aria-expanded', 'false');
        tafsirBtn.addEventListener('click', async () => {
            const body = document.querySelector(`.tafsir-body[data-index="${index}"]`);
            const open = !body.classList.contains('hidden');
            if (open) {
                body.classList.add('hidden');
                tafsirBtn.textContent = `▸ ${t.tafsirToggle}`;
                tafsirBtn.setAttribute('aria-expanded', 'false');
                return;
            }
            if (!tafsirCache) {
                body.textContent = t.tafsirLoading;
                body.classList.remove('hidden');
                tafsirCache = await fetchTafsir(id);
            }
            const tafsirText = tafsirCache?.ayahs?.[index]?.text || '—';
            body.textContent = tafsirText;
            body.classList.remove('hidden');
            tafsirBtn.textContent = `▾ ${t.tafsirToggle}`;
            tafsirBtn.setAttribute('aria-expanded', 'true');
        });
        el.after(tafsirBtn);
    });

    // ── Last read (IntersectionObserver) ──────────────────────────────────────
    const readObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                recordAyahRead(id, parseInt(entry.target.dataset.ayahNum, 10), arabicData.ayahs.length);
                storage.set('lastRead', {
                    surahId:     id,
                    ayahNum:     entry.target.dataset.ayahNum,
                    surahName:   arabicData.englishName,
                    surahNameAr: arabicData.name
                });
            }
        });
    }, { threshold: 0.6 });
    document.querySelectorAll('.ayah-card').forEach(c => readObserver.observe(c));

    // ── Audio state ───────────────────────────────────────────────────────────
    const playBtn      = document.getElementById('play-surah-btn');
    const status       = document.getElementById('audio-status');
    const customSelect = document.getElementById('reciter-custom-select');
    const selectedText = document.getElementById('selected-reciter-name');

    // ── Sticky player refs ──────────────────────────────────────────────────
    const stickyPlayer  = document.getElementById('sticky-player');
    const stickyPlayBtn = document.getElementById('sticky-play-btn');
    const stickyStatus  = document.getElementById('sticky-status');
    const stickyStopBtn = document.getElementById('sticky-stop-btn');

    const audioSection = document.querySelector('.audio-controls');
    let stickyObserver = null;
    if (audioSection && stickyPlayer) {
        stickyObserver = new IntersectionObserver(([entry]) => {
            const audioEl = document.getElementById('surah-audio');
            const isPlaying = audioEl && audioEl.src && !audioEl.paused;
            stickyPlayer.classList.toggle('hidden', entry.isIntersecting || !isPlaying);
        }, { threshold: 0 });
        stickyObserver.observe(audioSection);
    }

    // ── Range repeat toggle ─────────────────────────────────────────────────
    const rangeToggleBtn = document.getElementById('range-repeat-toggle');
    const rangePanel     = document.getElementById('range-repeat-panel');
    const rangeFromInput = document.getElementById('range-from');
    const rangeToInput   = document.getElementById('range-to');
    const rangeTimesInput= document.getElementById('range-times');
    const rangeStartBtn  = document.getElementById('range-start-btn');
    const rangeStopBtn   = document.getElementById('range-stop-btn');
    const rangeStatusEl  = document.getElementById('range-status');

    let rangeActive    = false;
    let rangeFromVal   = 1;
    let rangeToVal     = arabicData.numberOfAyahs;
    let rangeTimesVal  = 3;
    let rangeCurrentRound = 0;

    rangeToggleBtn.addEventListener('click', function () {
        const shown = !rangePanel.classList.contains('hidden');
        rangePanel.classList.toggle('hidden', shown);
        rangePanel.setAttribute('aria-hidden', String(shown));
        this.classList.toggle('active', !shown);
        this.setAttribute('aria-expanded', String(!shown));
    });

    const startRangeRepeat = () => {
        rangeFromVal  = Math.max(1, Math.min(arabicData.numberOfAyahs, parseInt(rangeFromInput.value, 10) || 1));
        rangeToVal    = Math.max(rangeFromVal, Math.min(arabicData.numberOfAyahs, parseInt(rangeToInput.value, 10) || arabicData.numberOfAyahs));
        rangeTimesVal = Math.max(1, parseInt(rangeTimesInput.value, 10) || 3);
        rangeCurrentRound = 1;
        rangeActive = true;
        rangeStartBtn.classList.add('hidden');
        rangeStopBtn.classList.remove('hidden');
        rangeStatusEl.textContent = `${t.rangeStatus} 1 ${t.rangeOf} ${rangeTimesVal}`;
    };

    const stopRangeRepeat = () => {
        rangeActive = false;
        rangeCurrentRound = 0;
        rangeStartBtn.classList.remove('hidden');
        rangeStopBtn.classList.add('hidden');
        rangeStatusEl.textContent = '';
    };

    rangeStartBtn.addEventListener('click', async () => {
        startRangeRepeat();
        if (!currentAudioData) {
            playBtn.click();
        } else {
            currentAyahIndex = rangeFromVal - 1;
            playAyah(currentAyahIndex);
            setPlayBtn(ICON_PAUSE, t.pause);
        }
    });

    rangeStopBtn.addEventListener('click', stopRangeRepeat);

    // ── Word-by-word toggle + state ─────────────────────────────────────────
    let wbwMode = false;
    let wbwTimestamps = null;

    document.getElementById('wbw-toggle').addEventListener('click', async function () {
        wbwMode = !wbwMode;
        this.classList.toggle('active', wbwMode);
        this.setAttribute('aria-pressed', String(wbwMode));

        if (wbwMode) {
            // Show wbw spans, hide plain+tajweed
            document.querySelectorAll('.text-wbw').forEach(el => el.classList.remove('hidden'));
            document.querySelectorAll('.text-tajweed, .text-plain').forEach(el => el.classList.add('hidden'));
            // Fetch timestamps if not yet loaded
            if (!wbwTimestamps) {
                wbwTimestamps = await fetchWordTimestamps(id);
            }
        } else {
            // Restore previous view (tajweed or plain)
            const tajOn = storage.get('tajweedOn', true);
            document.querySelectorAll('.text-wbw').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.text-tajweed').forEach(el => el.classList.toggle('hidden', !tajOn));
            document.querySelectorAll('.text-plain').forEach(el => el.classList.toggle('hidden', tajOn));
            document.querySelectorAll('.wbw-word').forEach(el => el.classList.remove('wbw-active'));
        }
    });

    // ── Word highlight engine ───────────────────────────────────────────────
    const highlightWord = (currentTimeMs) => {
        if (!wbwMode || !wbwTimestamps?.timestamps) return;

        // Clear all highlights
        document.querySelectorAll('.wbw-word.wbw-active').forEach(el => el.classList.remove('wbw-active'));

        // Find which verse and word is active
        for (const ts of wbwTimestamps.timestamps) {
            if (currentTimeMs < ts.timestamp_from || currentTimeMs > ts.timestamp_to) continue;
            if (!ts.segments) continue;

            for (const seg of ts.segments) {
                if (seg.length < 3) continue;
                const [wordPos, startMs, endMs] = seg;
                if (currentTimeMs >= startMs && currentTimeMs <= endMs) {
                    const wordEl = document.querySelector(`.wbw-word[data-verse="${ts.verse_key}"][data-word="${wordPos}"]`);
                    if (wordEl) {
                        wordEl.classList.add('wbw-active');
                        wordEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return;
                }
            }
        }
    };

    let selectedReciterId = savedReciter;
    let currentAudioData  = null;
    let currentAyahIndex  = 0;
    let loopAyahIndex     = -1;

    const setPlayBtn = (icon, label) => render(playBtn, `${icon} ${label}`);

    // ── Word-by-word timeupdate ──────────────────────────────────────────────
    audioPlayer.addEventListener('timeupdate', () => {
        if (wbwMode) highlightWord(audioPlayer.currentTime * 1000);
    });

    const playAyah = index => {
        const tr = i18n[state.currentLang];
        document.querySelectorAll('.ayah-card').forEach(c => c.style.borderColor = 'var(--glass-border)');
        const el = document.getElementById(`ayah-${index}`);
        if (el) {
            el.style.borderColor = 'var(--accent)';
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        audioPlayer.src          = currentAudioData.ayahs[index].audio;
        audioPlayer.playbackRate = storage.get('audioSpeed', 1);
        audioPlayer.play();
        const statusText = `${tr.ayah} ${index + 1} / ${currentAudioData.ayahs.length}`;
        status.innerText = statusText;
        if (stickyStatus) stickyStatus.innerText = statusText;
        if (stickyPlayBtn) render(stickyPlayBtn, ICON_PAUSE);
        if (stickyPlayer) stickyPlayer.classList.remove('hidden');
    };

    const stopPlayback = () => {
        const tr = i18n[state.currentLang];
        audioPlayer.pause();
        audioPlayer.src  = '';
        currentAudioData = null;
        currentAyahIndex = 0;
        loopAyahIndex    = -1;
        setPlayBtn(ICON_PLAY, tr.listen);
        status.innerText = tr.ready;
        if (stickyPlayer) stickyPlayer.classList.add('hidden');
        if (stickyPlayBtn) render(stickyPlayBtn, ICON_PLAY);
        document.querySelectorAll('.ayah-card').forEach(c => c.style.borderColor = 'var(--glass-border)');
        document.querySelectorAll('.loop-btn').forEach(b => b.classList.remove('active'));
    };

    // ── Sticky player controls ──────────────────────────────────────────────
    stickyPlayBtn?.addEventListener('click', () => {
        if (audioPlayer.src && currentAudioData) {
            if (audioPlayer.paused) {
                audioPlayer.play();
                render(stickyPlayBtn, ICON_PAUSE);
                setPlayBtn(ICON_PAUSE, i18n[state.currentLang].pause);
            } else {
                audioPlayer.pause();
                render(stickyPlayBtn, ICON_PLAY);
                setPlayBtn(ICON_PLAY, i18n[state.currentLang].resume);
            }
        }
    });

    stickyStopBtn?.addEventListener('click', stopPlayback);

    // ── Loop buttons ──────────────────────────────────────────────────────────
    document.querySelectorAll('.loop-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.index, 10);
            if (loopAyahIndex === idx) {
                loopAyahIndex = -1;
                btn.classList.remove('active');
            } else {
                document.querySelectorAll('.loop-btn').forEach(b => b.classList.remove('active'));
                loopAyahIndex = idx;
                btn.classList.add('active');
                if (currentAudioData?.ayahs?.[idx]) {
                    currentAyahIndex = idx;
                    playAyah(idx);
                    setPlayBtn(ICON_PAUSE, i18n[state.currentLang].pause);
                }
            }
        });
    });

    // ── Share buttons ─────────────────────────────────────────────────────────
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', async e => {
            e.stopPropagation();
            const tr    = i18n[state.currentLang];
            const idx   = parseInt(btn.dataset.index, 10);
            const ayah  = arabicData.ayahs[idx];
            const trans = translationData.ayahs[idx];
            const text  = `${ayah.text}\n\n${trans.text}\n\n— ${arabicData.englishName}, ${tr.ayah} ${ayah.numberInSurah}`;
            if (navigator.share) {
                try { await navigator.share({ title: `Al-Quran — ${arabicData.englishName}`, text }); } catch {}
            } else {
                try { await navigator.clipboard.writeText(text); } catch {}
                render(btn, ICON_CHECK);
                btn.style.color = 'var(--accent)';
                setTimeout(() => { render(btn, ICON_SHARE); btn.style.color = ''; }, 1800);
            }
        });
    });

    // ── Reciter selector ─────────────────────────────────────────────────────
    customSelect.querySelector('.custom-select-trigger').addEventListener('click', () => {
        customSelect.classList.toggle('open');
    });

    customSelect.querySelectorAll('.custom-option').forEach(option => {
        option.addEventListener('click', () => {
            const val  = option.getAttribute('data-value');
            const name = option.querySelector('.option-name').innerText;
            if (val !== selectedReciterId) {
                selectedReciterId = val;
                selectedText.innerText = name;
                storage.set('reciter', val);
                customSelect.querySelectorAll('.custom-option').forEach(o => o.removeAttribute('data-selected'));
                option.setAttribute('data-selected', 'true');
                stopPlayback();
            }
            customSelect.classList.remove('open');
        });
    });

    window.addEventListener('click', e => {
        if (!customSelect.contains(e.target)) customSelect.classList.remove('open');
    }, { signal: readerSignal });

    // ── Play / Pause button ───────────────────────────────────────────────────
    playBtn.addEventListener('click', async () => {
        const tr = i18n[state.currentLang];

        if (audioPlayer.src && currentAudioData) {
            if (audioPlayer.paused) {
                audioPlayer.play();
                setPlayBtn(ICON_PAUSE, tr.pause);
            } else {
                audioPlayer.pause();
                setPlayBtn(ICON_PLAY, tr.resume);
            }
            return;
        }

        status.innerText      = tr.loading;
        playBtn.disabled      = true;
        playBtn.style.opacity = '0.5';

        // ── Word-by-word mode: use quran.com chapter audio ──────────────
        if (wbwMode) {
            if (!wbwTimestamps) wbwTimestamps = await fetchWordTimestamps(id);
            if (wbwTimestamps?.audio_url) {
                currentAudioData = { wbw: true };
                audioPlayer.src          = wbwTimestamps.audio_url;
                audioPlayer.playbackRate = storage.get('audioSpeed', 1);
                audioPlayer.play();
                playBtn.disabled      = false;
                playBtn.style.opacity = '1';
                setPlayBtn(ICON_PAUSE, tr.pause);
                status.innerText = `${arabicData.englishName} — ${tr.wordByWord}`;
                if (stickyPlayer) stickyPlayer.classList.remove('hidden');
                if (stickyPlayBtn) render(stickyPlayBtn, ICON_PAUSE);

                audioPlayer.onended = () => {
                    const trEnd = i18n[state.currentLang];
                    status.innerText = trEnd.fin;
                    setPlayBtn(ICON_PLAY, trEnd.reListen);
                    currentAudioData = null;
                    document.querySelectorAll('.wbw-word.wbw-active').forEach(el => el.classList.remove('wbw-active'));
                    if (stickyPlayer) stickyPlayer.classList.add('hidden');
                };
                audioPlayer.onerror = () => {
                    status.innerText = tr.notAvailable;
                    setPlayBtn(ICON_PLAY, tr.listen);
                    currentAudioData = null;
                };
            } else {
                status.innerText      = tr.notAvailable;
                playBtn.disabled      = false;
                playBtn.style.opacity = '1';
            }
            return;
        }

        const reciterInfo = state.reciters.find(r => r.identifier === selectedReciterId);
        const isVBV       = reciterInfo?.type === 'versebyverse';

        if (isVBV) {
            // ── Verse-by-verse: play ayah by ayah ────────────────────────────
            currentAudioData = await fetchAudio(id, selectedReciterId);

            if (currentAudioData?.ayahs?.length > 0) {
                currentAyahIndex = rangeActive ? rangeFromVal - 1 : 0;
                playAyah(currentAyahIndex);
                playBtn.disabled      = false;
                playBtn.style.opacity = '1';
                setPlayBtn(ICON_PAUSE, tr.pause);

                audioPlayer.onended = () => {
                    if (loopAyahIndex >= 0) {
                        playAyah(loopAyahIndex);
                        return;
                    }

                    // ── Range repeat logic ──────────────────────────────────
                    if (rangeActive) {
                        currentAyahIndex++;
                        if (currentAyahIndex <= rangeToVal - 1) {
                            playAyah(currentAyahIndex);
                        } else {
                            rangeCurrentRound++;
                            if (rangeCurrentRound <= rangeTimesVal) {
                                currentAyahIndex = rangeFromVal - 1;
                                rangeStatusEl.textContent = `${i18n[state.currentLang].rangeStatus} ${rangeCurrentRound} ${i18n[state.currentLang].rangeOf} ${rangeTimesVal}`;
                                playAyah(currentAyahIndex);
                            } else {
                                stopRangeRepeat();
                                const trEnd = i18n[state.currentLang];
                                status.innerText = trEnd.fin;
                                setPlayBtn(ICON_PLAY, trEnd.reListen);
                                document.querySelectorAll('.ayah-card').forEach(c => c.style.borderColor = 'var(--glass-border)');
                                currentAudioData = null;
                            }
                        }
                        return;
                    }

                    currentAyahIndex++;
                    if (currentAyahIndex < currentAudioData.ayahs.length) {
                        playAyah(currentAyahIndex);
                    } else {
                        const trEnd = i18n[state.currentLang];
                        status.innerText = trEnd.fin;
                        setPlayBtn(ICON_PLAY, trEnd.reListen);
                        document.querySelectorAll('.ayah-card').forEach(c => c.style.borderColor = 'var(--glass-border)');
                        document.querySelectorAll('.loop-btn').forEach(b => b.classList.remove('active'));
                        currentAudioData = null;
                        loopAyahIndex    = -1;
                    }
                };
            } else {
                status.innerText      = tr.notAvailable;
                playBtn.disabled      = false;
                playBtn.style.opacity = '1';
            }
        } else {
            // ── Complete surah: single MP3 ────────────────────────────────────
            const audioUrl = `https://cdn.islamic.network/quran/audio-surah/128/${selectedReciterId}/${id}.mp3`;
            currentAudioData = { complete: true };
            audioPlayer.src          = audioUrl;
            audioPlayer.playbackRate = storage.get('audioSpeed', 1);
            audioPlayer.play();
            playBtn.disabled      = false;
            playBtn.style.opacity = '1';
            setPlayBtn(ICON_PAUSE, tr.pause);
            status.innerText = arabicData.englishName;

            audioPlayer.onerror = () => {
                status.innerText = tr.notAvailable;
                setPlayBtn(ICON_PLAY, tr.listen);
                currentAudioData = null;
            };
            audioPlayer.onended = () => {
                const trEnd = i18n[state.currentLang];
                status.innerText = trEnd.fin;
                setPlayBtn(ICON_PLAY, trEnd.reListen);
                currentAudioData = null;
            };
        }
    });

    window.scrollTo(0, 0);

    // ── Swipe navigation (mobile) ─────────────────────────────────────────────
    let touchStartX = 0;
    const container = document.querySelector('.reader-container');
    container.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    container.addEventListener('touchend', e => {
        const delta = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(delta) < 60) return;
        const numId = parseInt(id, 10);
        if (delta < 0 && numId < 114) navigate(`/surah/${numId + 1}`);
        if (delta > 0 && numId > 1)   navigate(`/surah/${numId - 1}`);
    }, { passive: true });

    // ── Background prefetch of adjacent surahs ────────────────────────────────
    const numId = parseInt(id, 10);
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => prefetchAdjacentSurahs(numId), { timeout: 3000 });
    } else {
        setTimeout(() => prefetchAdjacentSurahs(numId), 2000);
    }
}

function prefetchAdjacentSurahs(numId) {
    const ids = [];
    if (numId > 1)   ids.push(numId - 1);
    if (numId < 114) ids.push(numId + 1);
    ids.forEach(adjId => {
        fetch(`https://api.alquran.cloud/v1/surah/${adjId}/quran-uthmani`).catch(() => {});
    });
}
