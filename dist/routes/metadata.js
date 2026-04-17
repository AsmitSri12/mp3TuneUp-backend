"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rateLimiter_1 = require("../middleware/rateLimiter");
const sanitize_1 = require("../middleware/sanitize");
const ytdlp_1 = require("../services/ytdlp");
const router = (0, express_1.Router)();
/**
 * GET /metadata?url=<youtube-url>
 * Returns video title, thumbnail, duration, uploader, viewCount.
 */
router.get('/', rateLimiter_1.metadataLimiter, sanitize_1.sanitizeMiddleware, async (req, res) => {
    const url = req.cleanUrl;
    try {
        const metadata = await (0, ytdlp_1.getMetadata)(url);
        res.json({ success: true, data: metadata });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch metadata.';
        console.error('[metadata] Error:', message);
        const status = message.includes('too long') || message.includes('Invalid')
            ? 400
            : message.includes('timed out')
                ? 504
                : 502;
        res.status(status).json({ success: false, error: message });
    }
});
exports.default = router;
//# sourceMappingURL=metadata.js.map