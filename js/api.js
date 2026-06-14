const BASE_URL = 'https://api.alquran.cloud/v1';

// Abort any fetch that takes longer than 10 seconds
function fetchWithTimeout(url, ms = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal })
        .finally(() => clearTimeout(timer));
}

// Validated AlQuran Cloud fetch: returns `data.data` ONLY for a genuine success.
// On HTTP errors the API returns 200/4xx with `data` as a STRING message; without
// this guard that truthy string slips past callers and crashes on `.ayahs.map`.
async function fetchData(url) {
    const res  = await fetchWithTimeout(url);
    const json = await res.json();
    return (res.ok && json.code === 200 && json.data && typeof json.data === 'object')
        ? json.data
        : null;
}

export async function fetchSurahList() {
    try {
        return (await fetchData(`${BASE_URL}/surah`)) || [];
    } catch (e) {
        console.error('fetchSurahList:', e);
        return [];
    }
}

export async function fetchSurahDetail(id, edition = 'quran-uthmani') {
    try {
        return await fetchData(`${BASE_URL}/surah/${id}/${edition}`);
    } catch (e) {
        console.error('fetchSurahDetail:', e);
        return null;
    }
}

export async function fetchTranslation(id, lang = 'fr.hamidullah') {
    try {
        return await fetchData(`${BASE_URL}/surah/${id}/${lang}`);
    } catch (e) {
        console.error('fetchTranslation:', e);
        return null;
    }
}

export async function fetchAudio(id, edition = 'ar.alafasy') {
    try {
        return await fetchData(`${BASE_URL}/surah/${id}/${edition}`);
    } catch (e) {
        console.error('fetchAudio:', e);
        return null;
    }
}

export async function fetchTransliteration(id) {
    try {
        return await fetchData(`${BASE_URL}/surah/${id}/en.transliteration`);
    } catch (e) {
        console.error('fetchTransliteration:', e);
        return null;
    }
}

export async function fetchTafsir(id, edition = 'en.maarifulquran') {
    try {
        return await fetchData(`${BASE_URL}/surah/${id}/${edition}`);
    } catch (e) {
        console.error('fetchTafsir:', e);
        return null;
    }
}

export async function fetchMushafPage(page, edition = 'quran-tajweed') {
    try {
        return await fetchData(`${BASE_URL}/page/${page}/${edition}`);
    } catch (e) {
        console.error('fetchMushafPage:', e);
        return null;
    }
}

// ── Quran.com API (word-by-word timestamps) ──────────────────────────────────
const QURAN_COM_URL = 'https://api.quran.com/api/v4';

export async function fetchWordTimestamps(chapter, reciterId = 7) {
    try {
        const res  = await fetchWithTimeout(`${QURAN_COM_URL}/chapter_recitations/${reciterId}/${chapter}?segments=true`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.audio_file || null;
    } catch (e) {
        console.error('fetchWordTimestamps:', e);
        return null;
    }
}

export async function fetchVerseWords(chapter) {
    try {
        const res  = await fetchWithTimeout(`${QURAN_COM_URL}/verses/by_chapter/${chapter}?words=true&word_fields=text_uthmani&per_page=300`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.verses || [];
    } catch (e) {
        console.error('fetchVerseWords:', e);
        return [];
    }
}

export async function fetchReciters() {
    try {
        const data = await fetchData(`${BASE_URL}/edition?format=audio&language=ar`);
        // Sort: versebyverse first, then complete, alphabetically within each group
        return (data || []).sort((a, b) => {
            if (a.type === b.type) return a.englishName.localeCompare(b.englishName);
            return a.type === 'versebyverse' ? -1 : 1;
        });
    } catch (e) {
        console.error('fetchReciters:', e);
        return [];
    }
}
