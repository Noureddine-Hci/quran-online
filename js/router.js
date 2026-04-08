export function getRoute() {
    const hash = window.location.hash;
    if (hash === '#/bookmarks') return { view: 'bookmarks' };
    if (hash === '#/stats')     return { view: 'stats' };
    const mushafMatch = hash.match(/^#\/mushaf(?:\/(\d+))?$/);
    if (mushafMatch) return { view: 'mushaf', page: mushafMatch[1] || '1' };
    const match = hash.match(/^#\/surah\/(\d+)(?:\/(\d+))?$/);
    if (match) return { view: 'reader', id: match[1], ayah: match[2] || null };
    return { view: 'list' };
}

export function navigate(path) {
    window.location.hash = path;
}
