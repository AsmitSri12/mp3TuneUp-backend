import { Router, Request, Response } from 'express';
import { metadataLimiter } from '../middleware/rateLimiter';
import { sanitizeMiddleware } from '../middleware/sanitize';
import { getMetadata } from '../services/ytdlp';

const router = Router();

/**
 * GET /metadata?url=<youtube-url>
 * Returns video title, thumbnail, duration, uploader, viewCount.
 */
router.get(
  '/',
  metadataLimiter,
  sanitizeMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    const url = (req as Request & { cleanUrl: string }).cleanUrl;

    try {
      const metadata = await getMetadata(url);
      res.json({ success: true, data: metadata });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch metadata.';
      console.error('[metadata] Error:', message);

      const status =
        message.includes('too long') || message.includes('Invalid')
          ? 400
          : message.includes('timed out')
          ? 504
          : 502;

      res.status(status).json({ success: false, error: message });
    }
  }
);

export default router;
