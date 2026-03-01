/**
 * getImageUrl — resolves any image path/URL to a fully-qualified URL.
 */

const BACKEND_HOST = (() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
    // Strip the "/api" suffix to get bare host, e.g. "http://localhost:5001"
    return apiBase.replace(/\/api\/?$/, '');
})();

export function getImageUrl(src) {
    if (!src) return null;

    // 1. Strip hardcoded localhost ports from old DB entries (e.g. http://localhost:5000/uploads/...)
    // This turns them into clean relative paths like /uploads/...
    let cleanSrc = src;
    if (/^https?:\/\/(localhost|127\.0\.0\.1):\d+/i.test(cleanSrc)) {
        cleanSrc = cleanSrc.replace(/^https?:\/\/(localhost|127\.0\.0\.1):\d+/i, '');
    }

    // 2. Already a full absolute URL (http/https/blob/data) EXCEPT the localhost ones we just stripped
    if (/^(https?:|blob:|data:)/i.test(cleanSrc)) return cleanSrc;

    // 3. Relative path — prepend dynamic backend host
    cleanSrc = cleanSrc.startsWith('/') ? cleanSrc : `/${cleanSrc}`;
    return `${BACKEND_HOST}${cleanSrc}`;
}

export default getImageUrl;
