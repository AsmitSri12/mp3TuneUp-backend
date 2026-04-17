"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUrl = sanitizeUrl;
exports.sanitizeMiddleware = sanitizeMiddleware;
// YouTube URL regex: matches youtube.com/watch, youtu.be, /shorts/, /embed/
const YOUTUBE_REGEX = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}(\S*)$/;
// Shell metacharacters to block
const SHELL_METACHAR_REGEX = /[;&|`$<>(){}[\]\\!#*?"']/;
function sanitizeUrl(raw) {
    if (!raw || typeof raw !== 'string') {
        return { safe: false, url: '', error: 'URL is required.' };
    }
    const trimmed = decodeURIComponent(raw.trim());
    if (trimmed.length > 2048) {
        return { safe: false, url: '', error: 'URL is too long.' };
    }
    if (!YOUTUBE_REGEX.test(trimmed)) {
        return {
            safe: false,
            url: '',
            error: 'Invalid YouTube URL. Please provide a valid youtube.com or youtu.be link.',
        };
    }
    if (SHELL_METACHAR_REGEX.test(trimmed)) {
        return { safe: false, url: '', error: 'URL contains invalid characters.' };
    }
    return { safe: true, url: trimmed };
}
function sanitizeMiddleware(req, res, next) {
    const raw = req.query.url || req.body?.url;
    if (!raw) {
        res.status(400).json({ error: 'URL parameter is required.' });
        return;
    }
    const result = sanitizeUrl(String(raw));
    if (!result.safe) {
        res.status(400).json({ error: result.error });
        return;
    }
    // Attach the cleaned URL back to request for handlers
    req.cleanUrl = result.url;
    next();
}
//# sourceMappingURL=sanitize.js.map