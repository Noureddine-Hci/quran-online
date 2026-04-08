import { state }    from './state.js';
import { i18n }     from './i18n.js';
import { storage }  from './storage.js';
import { getRoute, navigate } from './router.js';
import { render, showLoading } from './dom.js';
import { fetchSurahList, fetchReciters } from './api.js';
import { renderSurahList }    from './views/list.js';
import { renderSurahReader }  from './views/reader.js';
import { renderBookmarks }    from './views/bookmarks.js';
import { renderStats }        from './views/stats.js';
import { renderMushaf }       from './views/mushaf.js';
import { initReminder }       from './reminder.js';

// ── Route handler ─────────────────────────────────────────────────────────────
async function handleRoute() {
    if (state.surahs.length === 0) return;
    const route = getRoute();
    if      (route.view === 'reader')    await renderSurahReader(route.id, route.ayah);
    else if (route.view === 'mushaf')    await renderMushaf(route.page);
    else if (route.view === 'bookmarks') renderBookmarks();
    else if (route.view === 'stats')     renderStats();
    else                                 renderSurahList();
}

window.addEventListener('hashchange', handleRoute);

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
    try {
        setupScrollHandler();
        renderLangSelector();
        initReminder();
        showLoading();
        [state.surahs, state.reciters] = await Promise.all([
            fetchSurahList(),
            fetchReciters()
        ]);
        if (state.surahs.length === 0) {
            document.getElementById('app-view').textContent =
                '⚠️ Impossible de contacter l\'API. Vérifiez votre connexion ou désactivez le VPN.';
            return;
        }
        await handleRoute();
    } catch (err) {
        console.error('[init] Fatal error:', err);
        document.getElementById('app-view').textContent = 'Erreur de chargement — voir la console (F12).';
    }
}

// ── Scroll handler ────────────────────────────────────────────────────────────
function setupScrollHandler() {
    const nav       = document.getElementById('main-nav');
    const scrollBtn = document.getElementById('scroll-top-btn');
    window.addEventListener('scroll', () => {
        nav.classList.toggle('scrolled', window.scrollY > 20);
        scrollBtn.classList.toggle('visible', window.scrollY > 400);
    });
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── Language selector ─────────────────────────────────────────────────────────
let langSelectorAbort = null;
function renderLangSelector() {
    if (langSelectorAbort) langSelectorAbort.abort();
    langSelectorAbort = new AbortController();
    const container    = document.getElementById('lang-selector-container');
    const availableLangs = [
        { code: 'fr', name: 'Français' },
        { code: 'en', name: 'English'  }
    ];

    render(container, `
        <div id="lang-custom-select" class="custom-select glass header-select">
            <div class="custom-select-trigger">
                <span id="selected-lang-name">${(availableLangs.find(l => l.code === state.currentLang) || availableLangs[0]).name}</span>
                <div class="arrow"></div>
            </div>
            <div class="custom-options glass">
                ${availableLangs.map(l => `
                    <div class="custom-option" data-value="${l.code}" ${l.code === state.currentLang ? 'data-selected="true"' : ''}>
                        <span class="option-name">${l.name}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `);

    const select = container.querySelector('#lang-custom-select');
    select.querySelector('.custom-select-trigger').addEventListener('click', e => {
        e.stopPropagation();
        select.classList.toggle('open');
    });

    container.querySelectorAll('.custom-option').forEach(option => {
        option.addEventListener('click', () => {
            const newLang = option.getAttribute('data-value');
            if (newLang !== state.currentLang) {
                state.currentLang = newLang;
                storage.set('lang', state.currentLang);
                updateBookmarksNavLabel();
                renderLangSelector();
                const route = getRoute();
                if (route.view === 'reader' && state.currentSurahId) renderSurahReader(state.currentSurahId);
                else renderSurahList();
            }
        });
    });

    document.addEventListener('click', e => {
        if (!select.contains(e.target)) select.classList.remove('open');
    }, { signal: langSelectorAbort.signal });
}

function updateBookmarksNavLabel() {
    const label = document.getElementById('bookmarks-nav-label');
    if (label) label.textContent = i18n[state.currentLang].bookmarks;
}

// ── Global event listeners ────────────────────────────────────────────────────
document.getElementById('home-btn').addEventListener('click', e => {
    e.preventDefault();
    navigate('/');
});

// ── Theme toggle ───────────────────────────────────────────────────────────────
(function setupTheme() {
    const btn      = document.getElementById('theme-toggle-btn');
    const iconEl   = document.getElementById('theme-icon');
    const MOON_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    const SUN_SVG  = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

    function applyTheme(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            render(btn, MOON_SVG);
            btn.setAttribute('aria-label', 'Passer en mode sombre');
        } else {
            document.documentElement.removeAttribute('data-theme');
            render(btn, SUN_SVG);
            btn.setAttribute('aria-label', 'Passer en mode clair');
        }
    }

    const saved = storage.get('theme', 'dark');
    applyTheme(saved);

    btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        storage.set('theme', next);
        applyTheme(next);
    });
})();

document.getElementById('bookmarks-nav-btn').addEventListener('click', () => navigate('/bookmarks'));
document.getElementById('stats-nav-btn').addEventListener('click', () => navigate('/stats'));

// ── Burger menu (mobile) ─────────────────────────────────────────────────────
(function setupBurger() {
    const burger  = document.getElementById('burger-btn');
    const nav     = document.getElementById('nav-actions');
    if (!burger || !nav) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    const toggle = () => {
        const open = !burger.classList.contains('open');
        burger.classList.toggle('open', open);
        nav.classList.toggle('open', open);
        overlay.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
    };

    const close = () => {
        if (burger.classList.contains('open')) toggle();
    };

    burger.addEventListener('click', toggle);
    overlay.addEventListener('click', close);

    // Close on nav button click
    nav.querySelectorAll('.nav-icon-btn').forEach(btn => btn.addEventListener('click', close));

    // Close on page navigation
    window.addEventListener('hashchange', close);
})();

// ── Bottom nav (mobile) ──────────────────────────────────────────────────────
(function setupBottomNav() {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;

    const updateActive = () => {
        const hash = location.hash || '#/';
        nav.querySelectorAll('.bottom-nav-item').forEach(btn => {
            const target = btn.dataset.target;
            const isActive = (target === '/' && (hash === '#/' || hash === '#' || hash === ''))
                || (target === '/bookmarks' && hash === '#/bookmarks')
                || (target === '/stats' && hash === '#/stats')
                || (target === '/mushaf' && hash.startsWith('#/mushaf'))
                || (target !== '/' && target !== '/bookmarks' && target !== '/stats' && target !== '/mushaf' && target !== 'search' && hash.startsWith('#' + target));
            btn.classList.toggle('active', isActive);
        });
    };

    nav.addEventListener('click', e => {
        const btn = e.target.closest('.bottom-nav-item');
        if (!btn) return;
        const target = btn.dataset.target;
        if (target === 'search') {
            navigate('/');
            setTimeout(() => {
                const searchBar = document.querySelector('.search-bar');
                if (searchBar) { searchBar.focus(); searchBar.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
            }, 300);
        } else {
            navigate(target);
        }
    });

    window.addEventListener('hashchange', updateActive);
    updateActive();
})();

// ── Auto-hide header on scroll ───────────────────────────────────────────────
(function setupAutoHideNav() {
    const nav = document.getElementById('main-nav');
    let lastY = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const y = window.scrollY;
            if (y > 100 && y > lastY + 5) {
                nav.classList.add('nav-hidden');
            } else if (y < lastY - 5) {
                nav.classList.remove('nav-hidden');
            }
            lastY = y;
            ticking = false;
        });
    }, { passive: true });
})();

// ── OLED dark mode toggle ────────────────────────────────────────────────────
(function setupOLED() {
    const oled = storage.get('oled', false);
    if (oled) document.documentElement.setAttribute('data-oled', 'true');
})();

init();

// ── Service Worker registration ────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .catch(err => console.warn('SW registration failed:', err));
    });
}
