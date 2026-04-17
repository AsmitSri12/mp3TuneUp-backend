"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rateLimiter_1 = require("../middleware/rateLimiter");
const sanitize_1 = require("../middleware/sanitize");
const ytdlp_1 = require("../services/ytdlp");
const ffmpeg_1 = require("../services/ffmpeg");
const router = (0, express_1.Router)();
/**
 * POST /convert
 * Body: { url: string, quality?: "128k" | "192k" | "320k" }
 * Streams MP3 audio back to the client.
 */
router.post('/', rateLimiter_1.convertLimiter, sanitize_1.sanitizeMiddleware, async (req, res) => {
    const url = req.cleanUrl;
    const quality = (['128k', '192k', '320k'].includes(req.body?.quality)
        ? req.body.quality
        : '192k');
    try {
        // Validate metadata first to check duration limit before spawning conversion
        const metadata = await (0, ytdlp_1.getMetadata)(url);
        const safeTitle = metadata.title
            .replace(/[^\w\s-]/g, '')
            .trim()
            .replace(/\s+/g, '_')
            .substring(0, 100);
        const filename = `${safeTitle || 'audio'}.mp3`;
        console.log(`[convert] Starting: "${metadata.title}" | ${metadata.duration}s | ${quality}`);
        const ytdlpProcess = (0, ytdlp_1.createAudioStream)(url);
        (0, ffmpeg_1.streamMp3ToResponse)(ytdlpProcess, res, filename, quality);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Conversion failed.';
        console.error('[convert] Error:', message);
        const status = message.includes('too long') || message.includes('Invalid')
            ? 400
            : message.includes('timed out')
                ? 504
                : 500;
        if (!res.headersSent) {
            res.status(status).json({ success: false, error: message });
        }
    }
});
exports.default = router;
//# sourceMappingURL=convert.js.map